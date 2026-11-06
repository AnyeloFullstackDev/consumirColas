import 'dotenv/config';

export interface EnvConfig {
	RABBIT_HOST: string;
	RABBIT_PORT: number;
	RABBIT_USER: string;
	RABBIT_PASSWORD: string;
	RABBIT_VHOST: string;
	RABBIT_API_KEY: string;
	DEFAULT_QUEUE_IN: string;
	DEFAULT_QUEUE_OUT: string;
}

const resolveApiKey = (): string => {
	if (process.env.RABBIT_API_KEY) return process.env.RABBIT_API_KEY;
	if (process.env.DEFAULT_API_KEY) return process.env.DEFAULT_API_KEY;
	if (process.env.API_KEY) return process.env.API_KEY;
	// Buscar dinámicamente cualquier variable de entorno que contenga API_KEY
	const match = Object.entries(process.env).find(
		([key, value]) =>
			Boolean(value) && (key.endsWith('API_KEY_RABBIT') || key.endsWith('_API_KEY'))
	);
	return match ? match[1]! : '';
};

export const ENV: EnvConfig = {
	RABBIT_HOST: process.env.RABBIT_HOST || 'localhost',
	RABBIT_PORT: Number(process.env.RABBIT_PORT) || 5672,
	RABBIT_USER: process.env.RABBIT_USER || 'guest',
	RABBIT_PASSWORD: process.env.RABBIT_PASSWORD || 'guest',
	RABBIT_VHOST: process.env.RABBIT_VHOST || '/',
	RABBIT_API_KEY: resolveApiKey(),
	DEFAULT_QUEUE_IN:
		process.env.DEFAULT_QUEUE_IN ||
		process.env.QUEUE_IN ||
		process.env.COLA_IN_GETPERSON_DATA ||
		'ConsumerCitizensPersonData',
	DEFAULT_QUEUE_OUT:
		process.env.DEFAULT_QUEUE_OUT ||
		process.env.QUEUE_OUT ||
		process.env.COLA_OUT_GETPERSON_DATA ||
		'CitizensPersonData',
};
