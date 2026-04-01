/**
 * Read saved client hint for `prefers-color-scheme` (cookie fallback) or
 * `Sec-CH-Prefers-Color-Scheme` when the browser sends it.
 * Set the cookie from a short inline script on first load if you need SSR theming without Critical-CH.
 */
export const PREFERS_COLOR_SCHEME_COOKIE_NAME = "CH-prefers-color-scheme";

export type ColorScheme = "light" | "dark";

function isColorScheme(value: string | null): value is ColorScheme {
	return value === "light" || value === "dark";
}

export function getClientHintColorScheme(request: Request): ColorScheme | undefined {
	const header = request.headers.get("Sec-CH-Prefers-Color-Scheme");
	if (isColorScheme(header)) return header;

	const cookieHeader = request.headers.get("cookie");
	if (!cookieHeader) return undefined;

	const match = cookieHeader.match(
		new RegExp(`(?:^|;\\s*)${PREFERS_COLOR_SCHEME_COOKIE_NAME}=(light|dark)(?:;|$)`),
	);
	const fromCookie = match?.[1] ?? null;
	if (isColorScheme(fromCookie)) return fromCookie;

	return undefined;
}

export function prefersColorSchemeCookieHeader(scheme: ColorScheme): string {
	return `${PREFERS_COLOR_SCHEME_COOKIE_NAME}=${scheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
