import { redirect } from "react-router";
import type { Route } from "./+types/sign-out";
import { cloudflareContext } from "~/contexts";
import { createAuth } from "~/services/auth/auth.server";

export async function action({ request, context }: Route.ActionArgs) {
	const { env } = context.get(cloudflareContext);
	const auth = createAuth(env);
	const { headers: signOutHeaders } = await auth.api.signOut({
		headers: request.headers,
		returnHeaders: true,
	});

	const headers = new Headers();
	for (const cookie of signOutHeaders.getSetCookie()) {
		headers.append("Set-Cookie", cookie);
	}
	headers.set("Location", "/auth/sign-in");
	return new Response(null, { status: 302, headers });
}

export async function loader() {
	return redirect("/auth/sign-in");
}

export default function AuthSignOut() {
	return null;
}
