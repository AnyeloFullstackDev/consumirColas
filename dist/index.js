/**
 * @module rabbit-queue-client
 * Cliente RPC sobre RabbitMQ reutilizable para consultar cualquier tipo de colas.
 */
export { RabbitQueueClient, QueueClient, RabbitRpcClient, } from './client.js';
export { RabbitService, } from './services/rabbit/rabbit.service.js';
export { ENV } from './config/env.config.js';
export { rabbitConnectOptions } from './config/rabbit.config.js';
export { logger } from './utils/logger.util.js';
