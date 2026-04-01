import { z } from "zod";

const emailMessage = z.object({
	type: z.literal("email"),
	to: z.string().email(),
	subject: z.string(),
	html: z.string(),
});

export const queueMessage = z.discriminatedUnion("type", [emailMessage]);

export type QueueMessage = z.infer<typeof queueMessage>;
export type EmailMessage = z.infer<typeof emailMessage>;
