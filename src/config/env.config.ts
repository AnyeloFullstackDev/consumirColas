import 'dotenv/config';

export interface EnvConfig {
	RABBIT_HOST: string;
	RABBIT_PORT: number;
	RABBIT_USER: string;
	RABBIT_PASSWORD: string;
	RABBIT_VHOST: string;
	RABBIT_API_KEY: string;
}

export const ENV: EnvConfig = {
	RABBIT_HOST: process.env.RABBIT_HOST || 'localhost',
	RABBIT_PORT: Number(process.env.RABBIT_PORT) || 5672,
	RABBIT_USER: process.env.RABBIT_USER || 'guest',
	RABBIT_PASSWORD: process.env.RABBIT_PASSWORD || 'guest',
	RABBIT_VHOST: process.env.RABBIT_VHOST || '/',
	RABBIT_API_KEY: process.env.RABBIT_API_KEY || '',
};
