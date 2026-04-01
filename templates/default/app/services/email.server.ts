import { Resend } from "resend";

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail(env: Env, options: EmailOptions): Promise<void> {
// {{#if includeQueues}}
	await env.TASK_QUEUE.send({
		type: "email",
		to: options.to,
		subject: options.subject,
		html: options.html,
	});
// {{/if}}
// {{#unless includeQueues}}
	await sendEmailDirect(env, options);
// {{/unless}}
}

export async function sendEmailDirect(env: Env, options: EmailOptions): Promise<void> {
	if (!env.RESEND_API_KEY || env.RESEND_API_KEY === "re_test_placeholder") {
		console.log(`[email-dev] to=${options.to} subject="${options.subject}"`);
		console.log(`[email-dev] html:\n${options.html}`);
		return;
	}
	const resend = new Resend(env.RESEND_API_KEY);
	await resend.emails.send({
		from: `noreply@${new URL(env.APP_URL).hostname}`,
		to: options.to,
		subject: options.subject,
		html: options.html,
	});
}
