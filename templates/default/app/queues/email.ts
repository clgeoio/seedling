import { sendEmailDirect } from "~/services/email.server";
import type { EmailMessage } from "./schemas";

export async function handleEmailMessage(env: Env, msg: EmailMessage): Promise<void> {
	await sendEmailDirect(env, { to: msg.to, subject: msg.subject, html: msg.html });
}
