import { data } from "react-router";
import type { Route } from "./+types/theme-switcher";
import { setThemeCookie, type Theme } from "~/services/theme.server";

function isTheme(value: unknown): value is Theme {
	return value === "light" || value === "dark" || value === "system";
}

export function loader() {
	return new Response("Method Not Allowed", { status: 405 });
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const raw = formData.get("theme");

	if (!isTheme(raw)) {
		return data({ ok: false }, { status: 400 });
	}

	return data({ ok: true }, {
		headers: { "Set-Cookie": setThemeCookie(raw) },
	});
}

