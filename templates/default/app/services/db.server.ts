import { drizzle } from "drizzle-orm/d1";
import * as schema from "~/drizzle/schema";

export function getDb(env: Env) {
	return drizzle(env.DB, { schema });
}

export type Database = ReturnType<typeof getDb>;
