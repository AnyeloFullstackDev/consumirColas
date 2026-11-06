export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare const logger: {
    info(contextOrMsg: string, ...args: unknown[]): void;
    warn(contextOrMsg: string, ...args: unknown[]): void;
    error(contextOrMsg: string, ...args: unknown[]): void;
    debug(contextOrMsg: string, ...args: unknown[]): void;
};
//# sourceMappingURL=logger.util.d.ts.map