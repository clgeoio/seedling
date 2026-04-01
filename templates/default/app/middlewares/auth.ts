import type { MiddlewareFunction } from "react-router";
import { createAuth } from "~/services/auth/auth.server";
import { authContext, cloudflareContext } from "~/contexts";

export interface AuthContext {
	user: {
		id: string;
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

	const sessionUser = session?.user as Record<string, unknown> | undefined;
	const isBanned = sessionUser?.banned === true;

	const user = sessionUser && !isBanned
		? {
				id: session.user.id,
				email: session.user.email,
				image: session.user.image ?? null,
				role: (sessionUser.role as string) ?? "user",
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
