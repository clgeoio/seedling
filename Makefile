.PHONY: build verify test test-fast test-unit lint format format-check typecheck clean try

build:
	pnpm build

verify: build typecheck lint format-check test

test: build
	pnpm test

test-fast: build
	pnpm vitest run src/__tests__/scaffold.test.ts src/__tests__/snapshot.test.ts

test-unit: build
	pnpm vitest run src/__tests__/scaffold.test.ts

lint:
	pnpm lint

format:
	pnpm format

format-check:
	pnpm format:check

typecheck:
	pnpm typecheck

clean:
	rm -rf dist

try: build
	rm -rf /tmp/seedling-try
	node dist/index.js create /tmp/seedling-try --yes --no-install --no-cloudflare
