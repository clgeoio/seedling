import { handleEmailQueueMessage } from "./email";

export async function handleQueue(batch: MessageBatch, env: Env): Promise<void> {
	const tasks: Promise<void>[] = [];
	for (const message of batch.messages) {
		tasks.push(processQueueMessage(message, env));
	}
	await Promise.all(tasks);
}

async function processQueueMessage(message: Message, env: Env): Promise<void> {
	try {
		await handleEmailQueueMessage(env, message.body);
		message.ack();
	} catch {
		message.retry();
	}
}
