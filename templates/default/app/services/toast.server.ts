import { COOKIE_PREFIX } from "~/lib/config";

const TOAST_COOKIE_NAME = `${COOKIE_PREFIX}_toast`;

export interface ToastMessage {
	type: "success" | "error" | "info" | "warning";
	message: string;
}

export function getToast(request: Request): ToastMessage | null {
	const cookie = request.headers.get("Cookie");
	if (!cookie) return null;

	const match = cookie.match(new RegExp(`${TOAST_COOKIE_NAME}=([^;]+)`));
	if (!match?.[1]) return null;

	try {
		return JSON.parse(decodeURIComponent(match[1])) as ToastMessage;
	} catch {
		return null;
	}
}

export function setToastCookie(toast: ToastMessage): string {
	const value = encodeURIComponent(JSON.stringify(toast));
	return `${TOAST_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=5`;
}

export function clearToastCookie(): string {
	return `${TOAST_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
