import { cleanupSessions } from "./cleanup-sessions";
import { cleanupVerifications } from "./cleanup-verifications";

type CronHandler = (env: Env) => Promise<void>;

/** Handlers run in order when `event.cron` matches {@link CRON_TRIGGER}. */
export const handlers: CronHandler[] = [cleanupSessions, cleanupVerifications];

/** Must match a cron entry in `wrangler.jsonc` / `wrangler.toml`. */
export const CRON_TRIGGER = "0 * * * *";

export async function handleScheduled(controller: ScheduledController, env: Env): Promise<void> {
	if (controller.cron !== CRON_TRIGGER) return;
	for (const handler of handlers) await handler(env);
}
