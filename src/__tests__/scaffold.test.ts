import { describe, it, expect } from "vitest";
import {
	processConditionals,
	substituteVariables,
	cleanupJson,
	buildContext,
} from "../scaffold.js";
import type { ProjectOptions, TemplateContext } from "../types.js";

function fullContext(overrides: Partial<TemplateContext> = {}): TemplateContext {
	return {
		projectName: "test-app",
		displayName: "Test App",
		includeAdmin: true,
		includeR2: true,
		includeTodos: true,
		includeCron: true,
		includeQueues: true,
		hasGithub: true,
		hasGoogle: true,
		hasSocialAuth: true,
		...overrides,
	};
}

function minimalContext(overrides: Partial<TemplateContext> = {}): TemplateContext {
	return {
		projectName: "bare-app",
		displayName: "Bare App",
		includeAdmin: false,
		includeR2: false,
		includeTodos: false,
		includeCron: false,
		includeQueues: false,
		hasGithub: false,
		hasGoogle: false,
		hasSocialAuth: false,
		...overrides,
	};
}

describe("substituteVariables", () => {
	it("replaces {{projectName}}", () => {
		const result = substituteVariables("name: {{projectName}}", fullContext());
		expect(result).toBe("name: test-app");
	});

	it("replaces {{displayName}}", () => {
		const result = substituteVariables("title: {{displayName}}", fullContext());
		expect(result).toBe("title: Test App");
	});

	it("replaces multiple occurrences", () => {
		const input = "{{projectName}} is called {{displayName}}. {{projectName}} rocks.";
		const result = substituteVariables(input, fullContext());
		expect(result).toBe("test-app is called Test App. test-app rocks.");
	});

	it("leaves unrelated content unchanged", () => {
		const result = substituteVariables("no variables here", fullContext());
		expect(result).toBe("no variables here");
	});
});

describe("processConditionals", () => {
	it("keeps content when condition is true", () => {
		const input = [
			"before",
			"// {{#if includeTodos}}",
			"  todos code here",
			"// {{/if}}",
			"after",
		].join("\n");

		const result = processConditionals(input, fullContext());
		expect(result).toContain("todos code here");
		expect(result).toContain("before");
		expect(result).toContain("after");
		expect(result).not.toContain("{{#if");
		expect(result).not.toContain("{{/if");
	});

	it("removes content when condition is false", () => {
		const input = [
			"before",
			"// {{#if includeTodos}}",
			"  todos code here",
			"// {{/if}}",
			"after",
		].join("\n");

		const result = processConditionals(input, minimalContext());
		expect(result).not.toContain("todos code here");
		expect(result).toContain("before");
		expect(result).toContain("after");
	});

	it("handles {{#unless}} - keeps when false", () => {
		const input = [
			"// {{#unless includeR2}}",
			"  no R2 fallback",
			"// {{/unless}}",
		].join("\n");

		const result = processConditionals(input, minimalContext());
		expect(result).toContain("no R2 fallback");
	});

	it("handles {{#unless}} - removes when true", () => {
		const input = [
			"// {{#unless includeR2}}",
			"  no R2 fallback",
			"// {{/unless}}",
		].join("\n");

		const result = processConditionals(input, fullContext());
		expect(result).not.toContain("no R2 fallback");
	});

	it("handles nested conditionals", () => {
		const input = [
			"// {{#if hasSocialAuth}}",
			"  social auth enabled",
			"// {{#if hasGithub}}",
			"  github provider",
			"// {{/if}}",
			"// {{#if hasGoogle}}",
			"  google provider",
			"// {{/if}}",
			"// {{/if}}",
		].join("\n");

		const contextGithubOnly = fullContext({ hasGoogle: false });
		const result = processConditionals(input, contextGithubOnly);
		expect(result).toContain("social auth enabled");
		expect(result).toContain("github provider");
		expect(result).not.toContain("google provider");
	});

	it("removes entire nested block when parent is false", () => {
		const input = [
			"// {{#if hasSocialAuth}}",
			"  social stuff",
			"// {{#if hasGithub}}",
			"  github",
			"// {{/if}}",
			"// {{/if}}",
		].join("\n");

		const result = processConditionals(input, minimalContext());
		expect(result).not.toContain("social stuff");
		expect(result).not.toContain("github");
	});

	it("handles CSS comment syntax", () => {
		const input = [
			"/* {{#if includeTodos}} */",
			".todos { display: block; }",
			"/* {{/if}} */",
		].join("\n");

		const result = processConditionals(input, fullContext());
		expect(result).toContain(".todos { display: block; }");
	});

	it("handles SQL comment syntax", () => {
		const input = [
			"-- {{#if includeTodos}}",
			"CREATE TABLE todos (...);",
			"-- {{/if}}",
		].join("\n");

		const result = processConditionals(input, minimalContext());
		expect(result).not.toContain("CREATE TABLE todos");
	});

	it("handles hash comment syntax for env files", () => {
		const input = [
			"# {{#if hasGithub}}",
			"GITHUB_CLIENT_ID=",
			"# {{/if}}",
		].join("\n");

		const result = processConditionals(input, minimalContext());
		expect(result).not.toContain("GITHUB_CLIENT_ID");
	});

	it("handles multiple independent blocks", () => {
		const input = [
			"always",
			"// {{#if includeTodos}}",
			"todos",
			"// {{/if}}",
			"middle",
			"// {{#if includeAdmin}}",
			"admin",
			"// {{/if}}",
			"end",
		].join("\n");

		const ctx = minimalContext({ includeTodos: true });
		const result = processConditionals(input, ctx);
		expect(result).toContain("always");
		expect(result).toContain("todos");
		expect(result).toContain("middle");
		expect(result).not.toContain("admin");
		expect(result).toContain("end");
	});
});

describe("cleanupJson", () => {
	it("removes trailing commas and produces valid JSON", () => {
		const input = '{\n\t"a": 1,\n\t"b": 2,\n}';
		const result = cleanupJson(input);
		expect(() => JSON.parse(result)).not.toThrow();
		expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
	});

	it("handles empty object after conditional removal", () => {
		const input = '{\n\t"name": "test"\n}';
		const result = cleanupJson(input);
		expect(JSON.parse(result)).toEqual({ name: "test" });
	});

	it("preserves valid JSON unchanged (semantically)", () => {
		const input = '{"a":1,"b":2}';
		const result = cleanupJson(input);
		expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
	});

	it("handles nested trailing commas", () => {
		const input = '{"deps": {"react": "19",},}';
		const result = cleanupJson(input);
		expect(JSON.parse(result)).toEqual({ deps: { react: "19" } });
	});
});

describe("buildContext", () => {
	it("maps options to template context correctly", () => {
		const options: ProjectOptions = {
			projectName: "my-project",
			displayName: "My Project",
			socialProviders: ["github"],
			includeAdmin: true,
			includeR2: false,
			includeTodos: true,
			includeCron: false,
			includeQueues: false,
			installDeps: true,
			initGit: true,
		};

		const ctx = buildContext(options);
		expect(ctx.projectName).toBe("my-project");
		expect(ctx.displayName).toBe("My Project");
		expect(ctx.hasGithub).toBe(true);
		expect(ctx.hasGoogle).toBe(false);
		expect(ctx.hasSocialAuth).toBe(true);
		expect(ctx.includeAdmin).toBe(true);
		expect(ctx.includeR2).toBe(false);
	});

	it("sets hasSocialAuth false when no providers", () => {
		const options: ProjectOptions = {
			projectName: "test",
			displayName: "Test",
			socialProviders: [],
			includeAdmin: false,
			includeR2: false,
			includeTodos: false,
			includeCron: false,
			includeQueues: false,
			installDeps: false,
			initGit: false,
		};

		const ctx = buildContext(options);
		expect(ctx.hasSocialAuth).toBe(false);
		expect(ctx.hasGithub).toBe(false);
		expect(ctx.hasGoogle).toBe(false);
	});
});
