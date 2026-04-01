import type { MiddlewareFunction } from "react-router";
import { createLogger } from "~/services/logger.server";
import { requestIdContext, loggerContext, cloudflareContext } from "~/contexts";

export const loggerMiddleware: MiddlewareFunction = async ({ request, context }, next) => {
	const start = Date.now();
	const rid = context.get(requestIdContext);
	const { env } = context.get(cloudflareContext);
	const logger = createLogger(env.APP_ENV, rid || undefined);
	context.set(loggerContext, logger);

	const url = new URL(request.url);

	const response = (await next()) as Response;

	const duration = Date.now() - start;
	logger.info("request", {
		method: request.method,
		path: url.pathname,
		status: response.status,
		duration,
	});

	return response;
};
