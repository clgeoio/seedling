import type { MiddlewareFunction } from "react-router";
import { createAuth } from "~/services/auth/auth.server";
import { authContext, cloudflareContext } from "~/contexts";

export interface AuthContext {
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
		role: string;
	} | null;
}

const protectedPaths = ["/settings", "/todos", "/admin"];
const guestOnlyPaths = ["/auth/sign-in", "/auth/sign-up"];

export const authMiddleware: MiddlewareFunction = async ({ request, context }, next) => {
	const url = new URL(request.url);
	const { env } = context.get(cloudflareContext);
	const auth = createAuth(env);

	const session = await auth.api.getSession({
		headers: request.headers,
	});

	const user = session?.user
		? {
				id: session.user.id,
				name: session.user.name,
				email: session.user.email,
				image: session.user.image ?? null,
				role: ((session.user as Record<string, unknown>).role as string) ?? "user",
			}
		: null;

	context.set(authContext, { user });

	const isProtected = protectedPaths.some((p) => url.pathname.startsWith(p));
	const isGuestOnly = guestOnlyPaths.some((p) => url.pathname.startsWith(p));

	if (isProtected && !user) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/auth/sign-in?redirect=${encodeURIComponent(url.pathname)}`,
			},
		});
	}

	if (isGuestOnly && user) {
		return new Response(null, {
			status: 302,
			headers: { Location: "/" },
		});
	}

	return next();
};
