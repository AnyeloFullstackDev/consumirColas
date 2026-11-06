/**
 * @module rabbit-queue-client
 * Cliente RPC sobre RabbitMQ reutilizable para consultar cualquier tipo de colas.
 */

export {
	RabbitQueueClient,
	QueueClient,
	RabbitRpcClient,
	type QueueClientOptions,
	type RabbitQueueClientOptions,
	type ConsultarEnColaParams,
} from './client.js';

export {
	RabbitService,
	type RabbitServiceOptions,
	type EnviarRpcParams,
} from './services/rabbit/rabbit.service.js';

export { ENV, type EnvConfig } from './config/env.config.js';
export { rabbitConnectOptions } from './config/rabbit.config.js';
export { logger, type LogLevel } from './utils/logger.util.js';
