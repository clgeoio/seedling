const AUTH_KV_PREFIX = "auth:";

interface SessionEnvelope {
	session: { expiresAt: string | number | Date };
}

function isSessionEnvelope(value: unknown): value is SessionEnvelope {
	if (typeof value !== "object" || value === null) return false;
	if (!("session" in value)) return false;
	const inner = (value as { session: unknown }).session;
	if (typeof inner !== "object" || inner === null) return false;
	if (!("expiresAt" in inner)) return false;
	const exp = (inner as { expiresAt: unknown }).expiresAt;
	return (
		typeof exp === "string" ||
		typeof exp === "number" ||
		exp instanceof Date
	);
}

function sessionEnvelopeExpiresAtMs(envelope: SessionEnvelope): number {
	const { expiresAt } = envelope.session;
	if (expiresAt instanceof Date) return expiresAt.getTime();
	if (typeof expiresAt === "number") return expiresAt;
	const parsed = Date.parse(expiresAt);
	return Number.isNaN(parsed) ? 0 : parsed;
}

interface ActiveSessionEntry {
	token: string;
	expiresAt: number;
}

function isActiveSessionEntry(value: unknown): value is ActiveSessionEntry {
	if (typeof value !== "object" || value === null) return false;
	const o = value as { token?: unknown; expiresAt?: unknown };
	return typeof o.token === "string" && typeof o.expiresAt === "number";
}

function parseActiveSessions(raw: string): ActiveSessionEntry[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw) as unknown;
	} catch {
		return [];
	}
	if (!Array.isArray(parsed)) return [];
	return parsed.filter(isActiveSessionEntry);
}

/**
 * Remove expired Better Auth session payloads from KV (`auth:*`).
 * Session tokens are stored as `auth:<token>`; active index keys are `auth:active-sessions-<userId>`.
 */
export async function cleanupSessions(env: Env): Promise<void> {
	const now = Date.now();
	let cursor: string | undefined;

	do {
		const listed = await env.APP_KV.list({ prefix: AUTH_KV_PREFIX, cursor });
		for (const key of listed.keys) {
			const name = key.name;
			if (name.startsWith(`${AUTH_KV_PREFIX}active-sessions-`)) {
				const raw = await env.APP_KV.get(name);
				if (!raw) continue;
				const entries = parseActiveSessions(raw).filter((e) => e.expiresAt > now);
				if (entries.length === 0) await env.APP_KV.delete(name);
				else await env.APP_KV.put(name, JSON.stringify(entries));
				continue;
			}

			const raw = await env.APP_KV.get(name);
			if (!raw) continue;

			let parsed: unknown;
			try {
				parsed = JSON.parse(raw) as unknown;
			} catch {
				continue;
			}

			if (!isSessionEnvelope(parsed)) continue;
			if (sessionEnvelopeExpiresAtMs(parsed) > now) continue;
			await env.APP_KV.delete(name);
		}
		cursor = listed.list_complete ? undefined : listed.cursor;
	} while (cursor !== undefined);
}
