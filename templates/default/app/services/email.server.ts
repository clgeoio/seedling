import { Resend } from "resend";

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail(env: Env, options: EmailOptions): Promise<void> {
// {{#if includeQueues}}
	await env.EMAIL_QUEUE.send({
		to: options.to,
		subject: options.subject,
		html: options.html,
	});
// {{/if}}
// {{#unless includeQueues}}
	const resend = new Resend(env.RESEND_API_KEY);
	await resend.emails.send({
		from: "noreply@${env.APP_URL.replace('https://', '').replace('http://', '')}",
		to: options.to,
		subject: options.subject,
		html: options.html,
	});
// {{/unless}}
}

export async function sendEmailDirect(env: Env, options: EmailOptions): Promise<void> {
	const resend = new Resend(env.RESEND_API_KEY);
	await resend.emails.send({
		from: `noreply@${new URL(env.APP_URL).hostname}`,
		to: options.to,
		subject: options.subject,
		html: options.html,
	});
}
