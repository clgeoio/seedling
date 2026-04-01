import type { MiddlewareFunction } from "react-router";

export const trimTrailingSlash: MiddlewareFunction = async ({ request }, next) => {
	const url = new URL(request.url);

	if (url.pathname !== "/" && url.pathname.endsWith("/")) {
		url.pathname = url.pathname.slice(0, -1);
		return new Response(null, {
			status: 308,
			headers: { Location: url.toString() },
		});
	}

	return next();
};
