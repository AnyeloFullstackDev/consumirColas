export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Formatea el mensaje agregando timestamp y contexto legible en consola.
 */
function formatMessage(
	level: string,
	contextOrMsg: string,
	args: unknown[]
): [string, ...unknown[]] {
	const timestamp = new Date().toISOString();

	if (args.length > 0 && typeof args[0] === 'string') {
		const context = contextOrMsg;
		const message = args[0];
		const rest = args.slice(1);
		return [`[${timestamp}] [${level}] [${context}] ${message}`, ...rest];
	}

	return [`[${timestamp}] [${level}] ${contextOrMsg}`, ...args];
}

export const logger = {
	info(contextOrMsg: string, ...args: unknown[]): void {
		const [formatted, ...rest] = formatMessage('INFO', contextOrMsg, args);
		console.log(formatted, ...rest);
	},

	warn(contextOrMsg: string, ...args: unknown[]): void {
		const [formatted, ...rest] = formatMessage('WARN', contextOrMsg, args);
		console.warn(formatted, ...rest);
	},

	error(contextOrMsg: string, ...args: unknown[]): void {
		const [formatted, ...rest] = formatMessage('ERROR', contextOrMsg, args);
		console.error(formatted, ...rest);
	},

	debug(contextOrMsg: string, ...args: unknown[]): void {
		if (process.env.DEBUG || process.env.LOG_LEVEL === 'debug') {
			const [formatted, ...rest] = formatMessage('DEBUG', contextOrMsg, args);
			console.log(formatted, ...rest);
		}
	},
};
