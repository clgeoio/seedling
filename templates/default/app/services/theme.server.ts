const THEME_COOKIE_NAME = "{{projectName}}_theme";

export type Theme = "light" | "dark" | "system";

export async function getTheme(request: Request): Promise<Theme> {
	const cookie = request.headers.get("Cookie");
	if (!cookie) return "system";

	const match = cookie.match(new RegExp(`${THEME_COOKIE_NAME}=([^;]+)`));
	return (match?.[1] as Theme) ?? "system";
}

export function setThemeCookie(theme: Theme): string {
	return `${THEME_COOKIE_NAME}=${theme}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;
}
