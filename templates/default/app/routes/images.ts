import type { Route } from "./+types/images";
import { cloudflareContext } from "~/contexts";
import { getImage } from "~/services/r2.server";

export async function loader({ params, context }: Route.LoaderArgs) {
	const { env } = context.get(cloudflareContext);
	const key = params["*"]?.trim();
	if (!key) {
		return new Response("Not found", { status: 404 });
	}
	return getImage(env, key);
}

export default function ImagesRoute(): null {
	return null;
}
