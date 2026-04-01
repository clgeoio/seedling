import type { MiddlewareFunction } from "react-router";
import { requestIdContext } from "~/contexts";

export const requestId: MiddlewareFunction = async ({ context }, next) => {
	const id = crypto.randomUUID();
	context.set(requestIdContext, id);

	const response = (await next()) as Response;
	response.headers.set("X-Request-Id", id);
	return response;
};
