import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import type { ProjectOptions, TemplateContext } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.resolve(__dirname, "..", "templates", "default");

const CONDITIONAL_PATHS: Record<string, string[]> = {
	includeAdmin: ["app/routes/admin", "app/services/auth/permissions.ts"],
	includeTodos: ["app/routes/todos.tsx", "drizzle/schema/todo.ts"],
	includeR2: ["app/routes/images.ts", "app/services/r2.server.ts"],
	includeCron: ["app/crons"],
	includeQueues: ["app/queues"],
};

const RENAME_MAP: Record<string, string> = {
	_gitignore: ".gitignore",
	"_dev.vars.example": ".dev.vars.example",
	"_oxfmtrc.json": ".oxfmtrc.json",
	"_oxlintrc.json": ".oxlintrc.json",
};

const TEXT_EXTENSIONS = new Set([
	".ts",
	".tsx",
	".js",
	".jsx",
	".json",
	".jsonc",
	".css",
	".html",
	".md",
	".yml",
	".yaml",
	".toml",
	".sql",
	".txt",
	".cjs",
	".mjs",
]);

/**
 * Scaffolds a new project by copying the default template, removing
 * conditional paths based on selected features, renaming dot-prefixed
 * files, and processing template variables/conditionals in all text files.
 *
 * @returns Absolute path to the created project directory
 * @throws If the target directory already exists and is non-empty
 */
export async function scaffold(options: ProjectOptions): Promise<string> {
	const targetDir = path.resolve(process.cwd(), options.projectName);

	if (await fs.pathExists(targetDir)) {
		const entries = await fs.readdir(targetDir);
		if (entries.length > 0) {
			throw new Error(`Directory "${options.projectName}" already exists and is not empty`);
		}
	}

	await fs.copy(TEMPLATE_DIR, targetDir);

	for (const [feature, paths] of Object.entries(CONDITIONAL_PATHS)) {
		if (!options[feature as keyof ProjectOptions]) {
			for (const p of paths) {
				await fs.remove(path.join(targetDir, p));
			}
		}
	}

	for (const [from, to] of Object.entries(RENAME_MAP)) {
		const fromPath = path.join(targetDir, from);
		const toPath = path.join(targetDir, to);
		if (await fs.pathExists(fromPath)) {
			await fs.rename(fromPath, toPath);
		}
	}

	const context = buildContext(options);
	await processDirectory(targetDir, context);

	return targetDir;
}

/** Maps user-facing ProjectOptions to the TemplateContext used by the template engine. */
export function buildContext(options: ProjectOptions): TemplateContext {
	return {
		projectName: options.projectName,
		displayName: options.displayName,
		includeAdmin: options.includeAdmin,
		includeR2: options.includeR2,
		includeTodos: options.includeTodos,
		includeCron: options.includeCron,
		includeQueues: options.includeQueues,
		hasGithub: options.socialProviders.includes("github"),
		hasGoogle: options.socialProviders.includes("google"),
		hasSocialAuth: options.socialProviders.length > 0,
	};
}

async function processDirectory(dir: string, context: TemplateContext): Promise<void> {
	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name === ".git") continue;
			await processDirectory(fullPath, context);
		} else if (isTextFile(entry.name)) {
			await processFile(fullPath, context);
		}
	}
}

function isTextFile(filename: string): boolean {
	const ext = path.extname(filename);
	if (TEXT_EXTENSIONS.has(ext)) return true;
	if (filename.startsWith(".") || filename === "Dockerfile") return true;
	return false;
}

async function processFile(filePath: string, context: TemplateContext): Promise<void> {
	let content = await fs.readFile(filePath, "utf-8");

	content = processConditionals(content, context);
	content = substituteVariables(content, context);

	if (filePath.endsWith(".json")) {
		content = cleanupJson(content);
	}

	await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Processes `{{#if feature}}...{{/if}}` and `{{#unless feature}}...{{/unless}}`
 * conditional blocks in template content. Supports nesting and any comment style.
 */
export function processConditionals(content: string, context: TemplateContext): string {
	const lines = content.split("\n");
	const result = processLines(lines, context);
	return result.join("\n");
}

function processLines(
	lines: string[],
	context: TemplateContext,
): string[] {
	const result: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const ifMatch = lines[i]?.match(/\{\{#if\s+(\w+)\}\}/);
		const unlessMatch = lines[i]?.match(/\{\{#unless\s+(\w+)\}\}/);

		if (ifMatch) {
			const feature = ifMatch[1] as string;
			const block = collectBlock(lines, i);
			i = block.endIndex + 1;
			if (context[feature as keyof TemplateContext]) {
				result.push(...processLines(block.content, context));
			}
		} else if (unlessMatch) {
			const feature = unlessMatch[1] as string;
			const block = collectBlock(lines, i);
			i = block.endIndex + 1;
			if (!context[feature as keyof TemplateContext]) {
				result.push(...processLines(block.content, context));
			}
		} else {
			result.push(lines[i] as string);
			i++;
		}
	}

	return result;
}

function collectBlock(
	lines: string[],
	startIndex: number,
): { content: string[]; endIndex: number } {
	const content: string[] = [];
	let depth = 1;
	let i = startIndex + 1;

	while (i < lines.length && depth > 0) {
		if (lines[i]?.match(/\{\{#(?:if|unless)\s+\w+\}\}/)) {
			depth++;
		}
		if (lines[i]?.match(/\{\{\/(?:if|unless)\}\}/)) {
			depth--;
			if (depth === 0) {
				return { content, endIndex: i };
			}
		}
		content.push(lines[i] as string);
		i++;
	}

	return { content, endIndex: i - 1 };
}

/** Replaces `{{projectName}}` and `{{displayName}}` placeholders with actual values. */
export function substituteVariables(content: string, context: TemplateContext): string {
	return content
		.replace(/\{\{projectName\}\}/g, context.projectName)
		.replace(/\{\{displayName\}\}/g, context.displayName);
}

/** Removes trailing commas and re-formats JSON content with tab indentation. */
export function cleanupJson(content: string): string {
	content = content.replace(/,(\s*[}\]])/g, "$1");
	content = content.replace(/\n{3,}/g, "\n\n");
	try {
		const parsed = JSON.parse(content);
		return JSON.stringify(parsed, null, "\t") + "\n";
	} catch {
		return content;
	}
}
