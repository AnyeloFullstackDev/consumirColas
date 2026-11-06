import type { Options } from 'amqplib';
import { RabbitService } from './services/rabbit/rabbit.service.js';
import { ENV } from './config/env.config.js';

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

export class RabbitQueueClient {
	public readonly rabbitService: RabbitService;
	private readonly defaultApiKey: string;
	private readonly defaultTimeoutMs: number;

	constructor(options: QueueClientOptions = {}) {
		this.defaultApiKey = ENV.RABBIT_API_KEY;
		this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
		this.rabbitService = new RabbitService(options.rabbit);
	}

	public async consultarEnCola<TResponse = any, TPayload = Record<string, any>>(
		params: ConsultarEnColaParams<TPayload>
	): Promise<TResponse> {
		const { queueIn, queueOut } = params;

		if (!queueIn || !queueOut) {
			throw new Error('Debes especificar obligatoriamente "queueIn" y "queueOut".');
		}

		// Asegurar apiKey en el payload si está disponible
		const rawPayload = params.payload as Record<string, any>;
		const apiKey = rawPayload?.apiKey || ENV.RABBIT_API_KEY;

		const payloadFinal =
			typeof rawPayload === 'object' && rawPayload !== null && apiKey
				? { apiKey, ...rawPayload }
				: rawPayload;

		return this.rabbitService.enviarRpc<TResponse>({
			queueIn,
			queueOut,
			payload: payloadFinal,
			correlationId: params.correlationId,
			timeoutMs: params.timeoutMs || this.defaultTimeoutMs,
		});
	}

	public async close(): Promise<void> {
		await this.rabbitService.close();
	}
}

// Alias para máxima comodidad
export { RabbitQueueClient as QueueClient, RabbitQueueClient as RabbitRpcClient };
export type { QueueClientOptions as RabbitQueueClientOptions };
