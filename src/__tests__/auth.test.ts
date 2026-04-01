import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import fs from "fs-extra";
import { scaffold } from "../scaffold.js";
import type { ProjectOptions } from "../types.js";

function baseOptions(overrides: Partial<ProjectOptions> = {}): ProjectOptions {
	return {
		projectName: "auth-test",
		displayName: "Auth Test",
		socialProviders: [],
		includeAdmin: false,
		includeR2: false,
		includeTodos: false,
		includeCron: false,
		includeQueues: false,
		installDeps: false,
		initGit: false,
		setupCloudflare: false,
		...overrides,
	};
}

function exec(cmd: string, cwd: string): string {
	try {
		return execSync(cmd, { cwd, encoding: "utf-8", timeout: 120_000, stdio: "pipe" });
	} catch (err: unknown) {
		const e = err as { stdout?: string; stderr?: string; message?: string };
		const details = [e.stdout, e.stderr, e.message].filter(Boolean).join("\n");
		throw new Error(`Command failed: ${cmd}\n${details}`);
	}
}

const DEV_PORT = 5198;
const BASE = `http://localhost:${DEV_PORT}`;
const AUTH_API = `${BASE}/api/auth`;

const TEST_USER = {
	name: "Test User",
	email: "test@example.com",
	password: "TestPassword123!",
	username: "testuser",
};

interface AuthUser {
	id: string;
	name: string;
	email: string;
}

interface AuthSession {
	id: string;
	token: string;
}

interface AuthResponse {
	user?: AuthUser | null;
	session?: AuthSession | null;
	token?: string | null;
	error?: { message: string };
}

async function waitForServer(port: number, timeoutMs = 60_000): Promise<void> {
	const start = Date.now();
	const url = `http://localhost:${port}`;

	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(2_000) });
			if (res.ok || res.status === 404) return;
		} catch {
			// server not ready yet
		}
		await new Promise((r) => setTimeout(r, 1_000));
	}
	throw new Error(`Dev server on port ${port} did not become ready within ${timeoutMs}ms`);
}

function killTree(pid: number): void {
	try {
		process.kill(-pid, "SIGTERM");
	} catch {
		try {
			process.kill(pid, "SIGKILL");
		} catch {
			// already dead
		}
	}
}

function extractCookies(res: Response): string {
	return res.headers
		.getSetCookie()
		.map((c) => c.split(";")[0])
		.join("; ");
}

describe("auth flow", { sequential: true }, () => {
	let tmpDir: string;
	let targetDir: string;
	let devServer: ChildProcess;
	let sessionCookies = "";

	beforeAll(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "seedling-auth-"));
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			targetDir = await scaffold(baseOptions());
		} finally {
			process.chdir(origCwd);
		}

		// Disable email verification and verification emails for testing
		// (no real email service available in test environment)
		const authPath = path.join(targetDir, "app/services/auth/auth.server.ts");
		let authContent = await fs.readFile(authPath, "utf-8");
		authContent = authContent.replace(
			"requireEmailVerification: true",
			"requireEmailVerification: false",
		);
		authContent = authContent.replace("sendOnSignUp: true", "sendOnSignUp: false");
		await fs.writeFile(authPath, authContent, "utf-8");

		exec("pnpm install --no-frozen-lockfile", targetDir);
		exec("npx wrangler d1 migrations apply DB --local", targetDir);

		devServer = spawn("npx", ["vite", "--port", String(DEV_PORT), "--strict-port"], {
			cwd: targetDir,
			stdio: "pipe",
			detached: true,
			env: { ...process.env, PORT: String(DEV_PORT) },
		});

		devServer.stderr?.on("data", (data: Buffer) => {
			const line = data.toString();
			if (line.includes("Error") || line.includes("error")) {
				console.error("[auth-test stderr]", line);
			}
		});

		await waitForServer(DEV_PORT, 60_000);
	}, 180_000);

	afterAll(async () => {
		if (devServer?.pid) {
			killTree(devServer.pid);
		}
		await new Promise((r) => setTimeout(r, 1_000));
		await fs.remove(tmpDir);
	});

	it("sign up creates a new account", async () => {
		const res = await fetch(`${AUTH_API}/sign-up/email`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify(TEST_USER),
			redirect: "manual",
		});
		expect(res.status).toBe(200);

		const body = (await res.json()) as AuthResponse;
		expect(body.user).toBeDefined();
		expect(body.user?.email).toBe(TEST_USER.email);
		expect(body.user?.name).toBe(TEST_USER.name);
	}, 15_000);

	it("sign in returns a session cookie", async () => {
		const res = await fetch(`${AUTH_API}/sign-in/email`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({
				email: TEST_USER.email,
				password: TEST_USER.password,
			}),
			redirect: "manual",
		});
		expect(res.status).toBe(200);

		sessionCookies = extractCookies(res);
		expect(sessionCookies).not.toBe("");

		const body = (await res.json()) as AuthResponse;
		expect(body.user?.email).toBe(TEST_USER.email);
	}, 15_000);

	it("get-session returns the authenticated user", async () => {
		const res = await fetch(`${AUTH_API}/get-session`, {
			headers: { Accept: "application/json", Cookie: sessionCookies },
		});
		expect(res.status).toBe(200);

		const body = (await res.json()) as AuthResponse;
		expect(body.user).toBeDefined();
		expect(body.user?.email).toBe(TEST_USER.email);
		expect(body.session).toBeDefined();
	}, 15_000);

	it("sign out invalidates the session", async () => {
		const res = await fetch(`${AUTH_API}/sign-out`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json", Cookie: sessionCookies },
			body: JSON.stringify({}),
		});
		expect(res.status).toBe(200);
	}, 15_000);

	it("session is invalid after sign out", async () => {
		const res = await fetch(`${AUTH_API}/get-session`, {
			headers: { Accept: "application/json", Cookie: sessionCookies },
		});
		const body = (await res.json()) as AuthResponse | null;
		const session = body === null ? null : (body.session ?? null);
		expect(session).toBeNull();
	}, 15_000);
});
