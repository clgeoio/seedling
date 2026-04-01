import { redirect, type LoaderFunctionArgs } from "react-router";
import { cloudflareContext } from "~/contexts";
import { createAuth } from "~/services/auth/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
	const { env } = context.get(cloudflareContext);
	const auth = createAuth(env);
	await auth.api.signOut({
		headers: request.headers,
	});
	throw redirect("/auth/sign-in");
}

export default function AuthSignOut() {
	return null;
}
