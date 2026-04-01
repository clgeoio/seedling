import { createContext } from "react-router";
import type { AuthContext } from "~/middlewares/auth";
import type { Logger } from "~/services/logger.server";

export const cloudflareContext = createContext<{ env: Env; ctx: ExecutionContext }>();
export const authContext = createContext<AuthContext>({ user: null });
export const requestIdContext = createContext<string>("");
export const loggerContext = createContext<Logger | null>(null);
