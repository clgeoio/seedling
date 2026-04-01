import type { Route } from "./+types/better";
import { cloudflareContext } from "~/contexts";
import { createAuth } from "~/services/auth/auth.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const { env } = context.get(cloudflareContext);
	const auth = createAuth(env);
	return auth.handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
	const { env } = context.get(cloudflareContext);
	const auth = createAuth(env);
	return auth.handler(request);
}

export default function BetterAuthApiRoute() {
	return null;
}
