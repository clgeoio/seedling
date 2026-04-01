import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import fs from "fs-extra";
import { scaffold } from "../scaffold.js";
import type { ProjectOptions } from "../types.js";

function baseOptions(overrides: Partial<ProjectOptions> = {}): ProjectOptions {
	return {
		projectName: "smoke-test",
		displayName: "Smoke Test",
		socialProviders: ["github", "google"],
		includeAdmin: true,
		includeR2: false,
		includeTodos: true,
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

const DEV_PORT = 5199;

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

describe("dev server smoke test", { sequential: true }, () => {
	let tmpDir: string;
	let targetDir: string;
	let devServer: ChildProcess;

	beforeAll(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "seedling-smoke-"));
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			targetDir = await scaffold(baseOptions());
		} finally {
			process.chdir(origCwd);
		}

		exec("pnpm install --no-frozen-lockfile", targetDir);

		devServer = spawn("npx", ["vite", "--port", String(DEV_PORT), "--strict-port"], {
			cwd: targetDir,
			stdio: "pipe",
			detached: true,
			env: { ...process.env, PORT: String(DEV_PORT) },
		});

		devServer.stderr?.on("data", (data: Buffer) => {
			const line = data.toString();
			if (line.includes("Error") || line.includes("error")) {
				console.error("[dev-server stderr]", line);
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

	it("GET / returns 200 with HTML", async () => {
		const res = await fetch(`http://localhost:${DEV_PORT}/`);
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("<!DOCTYPE html>");
	}, 15_000);

	it("GET /auth/sign-in returns 200", async () => {
		const res = await fetch(`http://localhost:${DEV_PORT}/auth/sign-in`);
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("<!DOCTYPE html>");
	}, 15_000);

	it("GET /nonexistent renders the not-found page", async () => {
		const res = await fetch(`http://localhost:${DEV_PORT}/nonexistent`);
		const html = await res.text();
		expect(html).toContain("<!DOCTYPE html>");
		expect(html.toLowerCase()).toContain("not found");
	}, 15_000);
});
