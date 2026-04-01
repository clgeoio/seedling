import { redirect } from "react-router";
import type { Route } from "./+types/theme-switcher";
import { setThemeCookie, type Theme } from "~/services/theme.server";

function isTheme(value: unknown): value is Theme {
	return value === "light" || value === "dark" || value === "system";
}

export function loader() {
	return new Response("Method Not Allowed", { status: 405 });
}

export async function action({ request }: Route.ActionArgs) {
	const referer = request.headers.get("Referer") ?? "/";
	const formData = await request.formData();
	const raw = formData.get("theme");

	if (!isTheme(raw)) {
		throw redirect(referer);
	}

	const headers = new Headers();
	headers.append("Set-Cookie", setThemeCookie(raw));
	throw redirect(referer, { headers });
}

export default function ThemeSwitcherRoute(): null {
	return null;
}
