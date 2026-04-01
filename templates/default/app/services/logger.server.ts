type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
	level: LogLevel;
	message: string;
	requestId?: string;
	timestamp: string;
	[key: string]: unknown;
}

export interface Logger {
	debug: (message: string, data?: Record<string, unknown>) => void;
	info: (message: string, data?: Record<string, unknown>) => void;
	warn: (message: string, data?: Record<string, unknown>) => void;
	error: (message: string, data?: Record<string, unknown>) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

export function createLogger(appEnv: string, requestId?: string): Logger {
	const isDev = appEnv === "development";
	const minLevel = isDev ? "debug" : "info";

	function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
		if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) return;

		const entry: LogEntry = {
			level,
			message,
			timestamp: new Date().toISOString(),
			...(requestId && { requestId }),
			...data,
		};

		if (isDev) {
			const color = { debug: "\x1b[36m", info: "\x1b[32m", warn: "\x1b[33m", error: "\x1b[31m" }[level];
			const reset = "\x1b[0m";
			const prefix = requestId ? ` [${requestId.slice(0, 8)}]` : "";
			const extra = data ? ` ${JSON.stringify(data)}` : "";
			console[level](`${color}${level.toUpperCase()}${reset}${prefix} ${message}${extra}`);
		} else {
			console[level](JSON.stringify(entry));
		}
	}

	return {
		debug: (message, data) => log("debug", message, data),
		info: (message, data) => log("info", message, data),
		warn: (message, data) => log("warn", message, data),
		error: (message, data) => log("error", message, data),
	};
}
