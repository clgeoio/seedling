import { cleanupSessions } from "./cleanup-sessions";
import { cleanupVerifications } from "./cleanup-verifications";

type CronHandler = (env: Env) => Promise<void>;

const cronJobs: Record<string, CronHandler[]> = {
	"0 */6 * * *": [cleanupSessions],
	"0 0 * * *": [cleanupVerifications],
};

export async function handleScheduled(controller: ScheduledController, env: Env): Promise<void> {
	const handlers = cronJobs[controller.cron];
	if (!handlers) {
		console.warn(`No handler registered for cron: ${controller.cron}`);
		return;
	}
	for (const handler of handlers) await handler(env);
}
