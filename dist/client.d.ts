import type { Options } from 'amqplib';
import { RabbitService } from './services/rabbit/rabbit.service.js';
export interface QueueClientOptions {
    rabbit?: Options.Connect;
    defaultTimeoutMs?: number;
}
export interface ConsultarEnColaParams<TPayload = Record<string, any>> {
    queueIn: string;
    queueOut: string;
    payload: TPayload;
    correlationId?: string;
    timeoutMs?: number;
}
export declare class RabbitQueueClient {
    readonly rabbitService: RabbitService;
    private readonly defaultApiKey;
    private readonly defaultTimeoutMs;
    constructor(options?: QueueClientOptions);
    consultarEnCola<TResponse = any, TPayload = Record<string, any>>(params: ConsultarEnColaParams<TPayload>): Promise<TResponse>;
    close(): Promise<void>;
}
export { RabbitQueueClient as QueueClient, RabbitQueueClient as RabbitRpcClient };
export type { QueueClientOptions as RabbitQueueClientOptions };
//# sourceMappingURL=client.d.ts.map