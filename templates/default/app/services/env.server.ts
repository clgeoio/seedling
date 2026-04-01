export function isDevelopment(env: Env): boolean {
	return env.APP_ENV === "development";
}

export function isProduction(env: Env): boolean {
	return env.APP_ENV === "production";
}
