import { sendEmailDirect } from "~/services/email.server";

export interface EmailQueueMessage {
	to: string;
	subject: string;
	html: string;
}

function parseEmailQueueMessage(body: unknown): EmailQueueMessage | null {
	let value = body;
	if (typeof value === "string") {
		try {
			value = JSON.parse(value) as unknown;
		} catch {
			return null;
		}
	}
	if (typeof value !== "object" || value === null) return null;
	const record = value as Record<string, unknown>;
	if (typeof record.to !== "string") return null;
	if (typeof record.subject !== "string") return null;
	if (typeof record.html !== "string") return null;
	return { to: record.to, subject: record.subject, html: record.html };
}

export async function handleEmailQueueMessage(env: Env, body: unknown): Promise<void> {
	const message = parseEmailQueueMessage(body);
	if (!message) return;
	await sendEmailDirect(env, message);
}
