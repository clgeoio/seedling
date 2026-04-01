import { createRequestHandler, RouterContextProvider } from "react-router";
import { cloudflareContext } from "~/contexts";
// {{#if includeCron}}
import { handleScheduled } from "~/crons";
// {{/if}}
// {{#if includeQueues}}
import { handleQueue } from "~/queues";
// {{/if}}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const context = new RouterContextProvider(
			new Map([[cloudflareContext, { env, ctx }]]),
		);
		return requestHandler(request, context);
	},
// {{#if includeCron}}

	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(handleScheduled(controller, env));
	},
// {{/if}}
// {{#if includeQueues}}

	async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(handleQueue(batch, env));
	},
// {{/if}}
} satisfies ExportedHandler<Env>;
