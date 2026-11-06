import { type Channel, type Options } from 'amqplib';
export interface RabbitServiceOptions {
    connectOptions?: Options.Connect;
    prefetch?: number;
}
export interface EnviarRpcParams {
    queueIn: string;
    queueOut: string;
    payload: Record<string, any>;
    correlationId?: string;
    timeoutMs?: number;
}
export declare class RabbitService {
    private readonly connectOptions;
    private readonly prefetchCount;
    private conexion;
    private canal;
    private readonly colasSuscritas;
    private readonly solicitudesPendientes;
    private readonly ultimoLogSinWorkers;
    private readonly INTERVALO_ALERTA_MS;
    private connectingPromise;
    private connectionGeneration;
    constructor(options?: RabbitServiceOptions | Options.Connect);
    getChannel(): Promise<Channel>;
    private initConnectionAndChannel;
    private resetConnection;
    /**
     * Asegura que exista un consumidor escuchando en la cola de respuesta.
     */
    asegurarEscuchaEnCola(colaRespuesta: string): Promise<void>;
    /**
     * Envía un mensaje RPC genérico a cualquier cola de RabbitMQ y espera la respuesta correlacionada.
     * Permite extender el servicio y consultar cualquier otra cola a medida que el sistema crezca.
     */
    enviarRpc<T = unknown>(params: EnviarRpcParams): Promise<T>;
    /**
     * Cierra ordenadamente el canal y la conexión AMQP durante el Graceful Shutdown.
     */
    close(): Promise<void>;
}
//# sourceMappingURL=rabbit.service.d.ts.map