import { RabbitService } from './services/rabbit/rabbit.service.js';
import { ENV } from './config/env.config.js';
export class RabbitQueueClient {
    rabbitService;
    defaultApiKey;
    defaultTimeoutMs;
    constructor(options = {}) {
        this.defaultApiKey = ENV.RABBIT_API_KEY;
        this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
        this.rabbitService = new RabbitService(options.rabbit);
    }
    async consultarEnCola(params) {
        const { queueIn, queueOut } = params;
        if (!queueIn || !queueOut) {
            throw new Error('Debes especificar obligatoriamente "queueIn" y "queueOut".');
        }
        // Asegurar apiKey en el payload si está disponible
        const rawPayload = params.payload;
        const apiKey = rawPayload?.apiKey || ENV.RABBIT_API_KEY;
        const payloadFinal = typeof rawPayload === 'object' && rawPayload !== null && apiKey
            ? { apiKey, ...rawPayload }
            : rawPayload;
        return this.rabbitService.enviarRpc({
            queueIn,
            queueOut,
            payload: payloadFinal,
            correlationId: params.correlationId,
            timeoutMs: params.timeoutMs || this.defaultTimeoutMs,
        });
    }
    async close() {
        await this.rabbitService.close();
    }
}
// Alias para máxima comodidad
export { RabbitQueueClient as QueueClient, RabbitQueueClient as RabbitRpcClient };
