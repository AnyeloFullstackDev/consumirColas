import type { Options } from 'amqplib';
import { RabbitService } from './services/rabbit/rabbit.service.js';
import { ENV } from './config/env.config.js';

export interface QueueClientOptions {
	/** Opciones de conexión a RabbitMQ (por defecto usa las variables de entorno RABBIT_*) */
	rabbit?: Options.Connect;
	/** API Key global por defecto para incluir en el payload si no se especifica */
	defaultApiKey?: string;
	/** Tiempo de espera por defecto en milisegundos (default: 30000) */
	defaultTimeoutMs?: number;
	/** Colas por defecto si se omiten en consultarEnCola */
	queues?: {
		in?: string;
		out?: string;
	};
}

export interface ConsultarEnColaParams<TPayload = Record<string, any>> {
	/** Cola de entrada en RabbitMQ donde se enviará el mensaje */
	queueIn?: string;
	/** Cola de respuesta en RabbitMQ donde se escuchará la respuesta */
	queueOut?: string;
	/** Payload o cuerpo del mensaje a enviar */
	payload: TPayload;
	/** Correlation ID opcional (se genera automáticamente un UUID si se omite) */
	correlationId?: string;
	/** Timeout máximo de espera en milisegundos (default: 30000) */
	timeoutMs?: number;
}

/**
 * Cliente RPC genérico para consultar cualquier tipo de colas en RabbitMQ.
 */
export class RabbitQueueClient {
	public readonly rabbitService: RabbitService;
	private readonly defaultApiKey: string;
	private readonly defaultQueues: { in: string; out: string };
	private readonly defaultTimeoutMs: number;

	constructor(options: QueueClientOptions = {}) {
		this.defaultApiKey = options.defaultApiKey || ENV.RABBIT_API_KEY;
		this.defaultQueues = {
			in: options.queues?.in || ENV.DEFAULT_QUEUE_IN,
			out: options.queues?.out || ENV.DEFAULT_QUEUE_OUT,
		};
		this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
		this.rabbitService = new RabbitService(options.rabbit);
	}

	/**
	 * Envía un mensaje RPC a cualquier cola de RabbitMQ y espera la respuesta correlacionada.
	 *
	 * Ejemplo de uso:
	 * ```typescript
	 * const data = await client.consultarEnCola({
	 *   queueIn: 'OtraColaIn',
	 *   queueOut: 'OtraColaOut',
	 *   payload: { foo: 'bar' },
	 * });
	 * ```
	 */
	public async consultarEnCola<TResponse = any, TPayload = Record<string, any>>(
		params: ConsultarEnColaParams<TPayload>
	): Promise<TResponse> {
		const queueIn = params.queueIn || this.defaultQueues.in;
		const queueOut = params.queueOut || this.defaultQueues.out;

		if (!queueIn || !queueOut) {
			throw new Error(
				'Debes especificar "queueIn" y "queueOut", o configurar las variables DEFAULT_QUEUE_IN y DEFAULT_QUEUE_OUT.'
			);
		}

		// Asegurar apiKey en el payload si está disponible
		const rawPayload = params.payload as Record<string, any>;
		const apiKey = rawPayload?.apiKey || this.defaultApiKey || ENV.RABBIT_API_KEY;

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

	/**
	 * Retorna las colas por defecto configuradas en el cliente.
	 */
	public getDefaultQueues(): { in: string; out: string } {
		return { ...this.defaultQueues };
	}

	/**
	 * Cierra ordenadamente el canal y la conexión con RabbitMQ.
	 */
	public async close(): Promise<void> {
		await this.rabbitService.close();
	}
}

// Alias para máxima comodidad
export { RabbitQueueClient as QueueClient, RabbitQueueClient as RabbitRpcClient };
export type { QueueClientOptions as RabbitQueueClientOptions };
