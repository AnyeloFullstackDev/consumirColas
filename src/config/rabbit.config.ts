import type { Options } from 'amqplib';
import { ENV } from './env.config.js';

export const rabbitConnectOptions: Options.Connect = {
	protocol: 'amqp',
	hostname: ENV.RABBIT_HOST,
	port: ENV.RABBIT_PORT,
	username: ENV.RABBIT_USER,
	password: ENV.RABBIT_PASSWORD,
	vhost: ENV.RABBIT_VHOST,
};
