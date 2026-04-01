import { handleEmailMessage } from "./email";
import { queueMessage } from "./schemas";

export async function handleQueue(batch: MessageBatch, env: Env): Promise<void> {
	for (const message of batch.messages) {
		const result = queueMessage.safeParse(message.body);
		if (!result.success) {
			console.error("Invalid queue message", result.error.flatten());
			message.ack();
			continue;
		}
		try {
			switch (result.data.type) {
				case "email":
					await handleEmailMessage(env, result.data);
					break;
			}
			message.ack();
		} catch {
			message.retry();
		}
	}
}
