import amqp from 'amqplib';
import { rabbitConnectOptions } from '../../config/rabbit.config.js';
import { logger } from '../../utils/logger.util.js';
import crypto from 'node:crypto';
export class RabbitService {
    connectOptions;
    prefetchCount;
    conexion = null;
    canal = null;
    colasSuscritas = new Set();
    solicitudesPendientes = new Map();
    ultimoLogSinWorkers = new Map();
    INTERVALO_ALERTA_MS = 5 * 60 * 1000; // 5 minutos
    connectingPromise = null;
    connectionGeneration = 0;
    constructor(options) {
        if (options && ('hostname' in options || 'port' in options || 'username' in options)) {
            this.connectOptions = options;
            this.prefetchCount = 100;
        }
        else if (options && typeof options === 'object') {
            const opts = options;
            this.connectOptions = opts.connectOptions || rabbitConnectOptions;
            this.prefetchCount = opts.prefetch || 100;
        }
        else {
            this.connectOptions = rabbitConnectOptions;
            this.prefetchCount = 100;
        }
    }
    async getChannel() {
        if (this.canal) {
            return this.canal;
        }
        if (this.connectingPromise) {
            return this.connectingPromise;
        }
        this.connectingPromise = this.initConnectionAndChannel();
        try {
            return await this.connectingPromise;
        }
        finally {
            this.connectingPromise = null;
        }
    }
    async initConnectionAndChannel() {
        const currentGen = ++this.connectionGeneration;
        try {
            if (!this.conexion) {
                const conn = await amqp.connect(this.connectOptions);
                this.conexion = conn;
                logger.info('RabbitMQ', 'Conexión TCP establecida con el broker.');
                conn.on('error', (err) => {
                    logger.error('RabbitMQ', 'Error en la conexión TCP:', err);
                    if (this.connectionGeneration === currentGen) {
                        this.resetConnection('Error en la conexión TCP');
                    }
                });
                conn.on('close', () => {
                    logger.warn('RabbitMQ', 'Conexión TCP cerrada.');
                    if (this.connectionGeneration === currentGen) {
                        this.resetConnection('Conexión TCP cerrada');
                    }
                });
            }
            const canal = await this.conexion.createChannel();
            await canal.prefetch(this.prefetchCount);
            // Listeners obligatorios en el canal para evitar crashes por 'Unhandled error'
            canal.on('error', (err) => {
                logger.error('RabbitMQ', 'Error en el canal AMQP:', err);
                if (this.canal === canal) {
                    this.canal = null;
                    this.colasSuscritas.clear();
                }
            });
            canal.on('close', () => {
                logger.warn('RabbitMQ', 'Canal AMQP cerrado.');
                if (this.canal === canal) {
                    this.canal = null;
                    this.colasSuscritas.clear();
                }
            });
            this.canal = canal;
            return this.canal;
        }
        catch (error) {
            this.resetConnection('Fallo al inicializar canal/conexión');
            throw error;
        }
    }
    resetConnection(motivo = 'Reinicio de conexión') {
        this.canal = null;
        this.conexion = null;
        this.colasSuscritas.clear();
        // Rechazar limpiamente solicitudes pendientes en vuelo
        if (this.solicitudesPendientes.size > 0) {
            logger.warn('RabbitMQ', `Rechazando ${this.solicitudesPendientes.size} solicitudes pendientes debido a: ${motivo}`);
            for (const [, pendiente] of this.solicitudesPendientes.entries()) {
                clearTimeout(pendiente.timer);
                pendiente.reject(new Error(`RabbitMQ no disponible: ${motivo}`));
            }
            this.solicitudesPendientes.clear();
        }
    }
    /**
     * Asegura que exista un consumidor escuchando en la cola de respuesta.
     */
    async asegurarEscuchaEnCola(colaRespuesta) {
        const canal = await this.getChannel();
        if (this.colasSuscritas.has(colaRespuesta)) {
            return;
        }
        this.colasSuscritas.add(colaRespuesta);
        try {
            await canal.assertQueue(colaRespuesta, { durable: true });
            logger.info('RabbitMQ', `Escuchando respuestas en cola: "${colaRespuesta}"`);
            await canal.consume(colaRespuesta, async (msg) => {
                if (!msg)
                    return;
                try {
                    const contenidoStr = msg.content.toString();
                    let dataParsed;
                    try {
                        dataParsed = JSON.parse(contenidoStr);
                    }
                    catch (jsonErr) {
                        logger.error('RabbitMQ', `Mensaje malformado en cola "${colaRespuesta}". No es JSON válido. Descartando mensaje...`, jsonErr);
                        canal.nack(msg, false, false);
                        return;
                    }
                    if (typeof dataParsed !== 'object' || dataParsed === null) {
                        logger.error('RabbitMQ', `Mensaje en cola "${colaRespuesta}" con formato inesperado (se esperaba objeto JSON). Descartando mensaje...`);
                        canal.nack(msg, false, false);
                        return;
                    }
                    const correlationId = msg.properties.correlationId ||
                        (this.solicitudesPendientes.size === 1
                            ? this.solicitudesPendientes.keys().next().value
                            : undefined);
                    if (!correlationId || !this.solicitudesPendientes.has(correlationId)) {
                        logger.warn('RabbitMQ', `Mensaje en cola "${colaRespuesta}" sin correlationId coincidente. Descartando mensaje.`);
                        canal.ack(msg);
                        return;
                    }
                    const pendiente = this.solicitudesPendientes.get(correlationId);
                    clearTimeout(pendiente.timer);
                    this.solicitudesPendientes.delete(correlationId);
                    pendiente.resolve(dataParsed);
                    logger.debug('RabbitMQ', `Respuesta despachada localmente para CorrelationId: ${correlationId}`);
                    canal.ack(msg);
                }
                catch (err) {
                    logger.error('RabbitMQ', 'Error al procesar mensaje de respuesta:', err);
                    canal.nack(msg, false, false);
                }
            }, { noAck: false });
        }
        catch (error) {
            this.colasSuscritas.delete(colaRespuesta);
            throw error;
        }
    }
    /**
     * Envía un mensaje RPC genérico a cualquier cola de RabbitMQ y espera la respuesta correlacionada.
     * Permite extender el servicio y consultar cualquier otra cola a medida que el sistema crezca.
     */
    async enviarRpc(params) {
        const canal = await this.getChannel();
        const { queueIn, queueOut, payload, correlationId = crypto.randomUUID(), timeoutMs = 30000, } = params;
        const mensajeBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload));
        // 1. Asegurar escucha en la cola de respuesta
        await this.asegurarEscuchaEnCola(queueOut);
        // 2. Asegurar cola de destino y verificar existencia de workers activos
        await canal.assertQueue(queueIn, { durable: true });
        const { consumerCount } = await canal.checkQueue(queueIn);
        // 3. Si no hay workers activos consumiendo de la cola de entrada
        if (consumerCount === 0) {
            const ahora = Date.now();
            const ultimoLog = this.ultimoLogSinWorkers.get(queueIn) || 0;
            if (ahora - ultimoLog >= this.INTERVALO_ALERTA_MS) {
                this.ultimoLogSinWorkers.set(queueIn, ahora);
                logger.error('RabbitMQ', `ALERTA CRÍTICA: La cola de entrada "${queueIn}" NO tiene ningún worker escuchando para procesar peticiones.`);
            }
            canal.sendToQueue(queueIn, mensajeBuffer, {
                contentType: 'application/json',
                deliveryMode: 2,
                persistent: true,
                correlationId,
                replyTo: queueOut,
                timestamp: Date.now(),
            });
            logger.warn('RabbitMQ', `Solicitud encolada en "${queueIn}" sin workers activos | ID: ${correlationId}`);
            throw new Error(`NO_CONSUMERS: La cola de entrada "${queueIn}" no tiene ningún worker activo disponible en este momento.`);
        }
        else {
            this.ultimoLogSinWorkers.delete(queueIn);
        }
        return new Promise((resolve, reject) => {
            let finalizado = false;
            const timer = setTimeout(() => {
                if (finalizado)
                    return;
                finalizado = true;
                this.solicitudesPendientes.delete(correlationId);
                reject(new Error(`Tiempo de espera agotado (${timeoutMs / 1000}s) esperando respuesta en cola "${queueOut}" para CorrelationId: ${correlationId}`));
            }, timeoutMs);
            const resolverExito = (data) => {
                if (finalizado)
                    return;
                finalizado = true;
                clearTimeout(timer);
                this.solicitudesPendientes.delete(correlationId);
                resolve(data);
            };
            this.solicitudesPendientes.set(correlationId, {
                resolve: resolverExito,
                reject: (err) => {
                    if (finalizado)
                        return;
                    finalizado = true;
                    clearTimeout(timer);
                    this.solicitudesPendientes.delete(correlationId);
                    reject(err);
                },
                timer,
            });
            const payloadLog = typeof payload === 'object' && payload !== null
                ? {
                    ...payload,
                    apiKey: payload.apiKey ? payload.apiKey.slice(0, 4) + '-***SENSIBLE***-' + payload.apiKey.slice(-5) : 'Sin apikey',
                }
                : payload;
            console.log('--- ENVIANDO MENSAJE A RABBITMQ ---');
            console.log('Cola destino (queueIn):', queueIn);
            console.log('Cola respuesta (queueOut):', queueOut);
            console.log('CorrelationId:', correlationId);
            console.log('Payload enviado:', JSON.stringify(payloadLog, null, 2));
            logger.info('RabbitMQ', `Mensaje publicado en "${queueIn}" | CorrelationId: ${correlationId}`);
            // Encolar mensaje
            canal.sendToQueue(queueIn, mensajeBuffer, {
                contentType: 'application/json',
                deliveryMode: 2,
                persistent: true,
                correlationId,
                replyTo: queueOut,
                timestamp: Date.now(),
            });
            logger.debug('RabbitMQ', `Solicitud encolada en "${queueIn}" | Escuchando en "${queueOut}" | ID: ${correlationId}`);
        });
    }
    /**
     * Cierra ordenadamente el canal y la conexión AMQP durante el Graceful Shutdown.
     */
    async close() {
        this.resetConnection('Cierre ordenado del servicio (Graceful Shutdown)');
        try {
            if (this.canal) {
                await this.canal.close();
                this.canal = null;
            }
        }
        catch {
            // Ignorar si ya estaba cerrado
        }
        try {
            if (this.conexion) {
                await this.conexion.close();
                this.conexion = null;
            }
        }
        catch {
            // Ignorar si ya estaba cerrado
        }
    }
}
