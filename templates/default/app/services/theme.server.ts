const THEME_COOKIE_NAME = "{{projectName}}_theme";

export type Theme = "light" | "dark" | "system";

const validThemes = new Set<Theme>(["light", "dark", "system"]);

export function getTheme(request: Request): Theme {
	const cookie = request.headers.get("Cookie");
	if (!cookie) return "system";

	const match = cookie.match(new RegExp(`${THEME_COOKIE_NAME}=([^;]+)`));
	const value = match?.[1];
	if (value && validThemes.has(value as Theme)) return value as Theme;
	return "system";
}

export function setThemeCookie(theme: Theme): string {
	return `${THEME_COOKIE_NAME}=${theme}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;
}
