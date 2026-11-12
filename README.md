# FashionWebsite

## Setup

Run `pnpm install` to install dependencies.

The Shopify Storefront API client types (`lib/shopify/storefront.generated.d.ts`, `lib/shopify/storefront.types.d.ts`) are committed to the repository so fresh checkouts can typecheck and build without a network call — see [DECISIONS.md D-017](./DECISIONS.md). Regenerate them with `pnpm graphql-codegen` whenever a `#graphql`-tagged query document under `lib/shopify/queries/` changes, or the pinned Storefront API version (`.graphqlrc.ts`, `lib/shopify/client.ts`) bumps, then commit the regenerated files alongside your change.

No password is needed to browse locally — the whole-site access gate was removed ([DECISIONS.md D-063](./DECISIONS.md)). `ESQUE_DROP_ACCESS_CODE` in `.env.local` is only the early-access code for an upcoming collection's teaser page. The Playwright suites supply their own environment via `webServer.env` (`playwright.config.ts`, `playwright.demo.config.ts`) — but only when Playwright starts the dev server itself: `reuseExistingServer: !process.env.CI` means it reuses a server you already have running, which then uses your own `.env.local`. Stop your dev server before running a suite if you want its fixed environment.

## New machine setup

Everything needed to continue this project is in this repository except
secrets and a few per-machine tools. On a new computer:

1. **Tools.** Install Node 22 (`nvm install && nvm use` reads `.nvmrc`), then enable pnpm through Corepack (`corepack enable` — `package.json` pins pnpm 11.22.0).
2. **GitHub.** Add an SSH key to your GitHub account, then sign in to the CLI with `gh auth login` (lets Claude open PRs and read CI).
3. **Dependencies.** `pnpm install`, then `pnpm exec playwright install --with-deps chromium webkit` for the browser tests.
4. **Secrets.** `cp .env.local.example .env.local` and fill in the values from your password manager — the Klaviyo private key and list ID, the drop-access code, and `PREVIEW_DEMO_MODE=1` for the sample catalog. Never commit `.env.local`; this repository is public.
5. **Claude Code — project setup (automatic).** Open this folder in Claude Code and approve what it asks for: the plugins listed in `.claude/settings.json` (superpowers, feature-dev, code-review, pr-review-toolkit, code-simplifier, security-guidance, frontend-design, typescript-lsp) and the context7 docs server in `.mcp.json`. The project's agents (`.claude/agents/`) and skills (`.claude/skills/`) load automatically.
6. **Claude Code — your global setup (copy once).** Restore the user-level files backed up in [`setup/claude/`](./setup/claude/README.md):
   ```bash
   mkdir -p ~/.claude/skills && cp setup/claude/global-CLAUDE.md ~/.claude/CLAUDE.md && cp -R setup/claude/skills/find-skills ~/.claude/skills/
   ```
   (Check first that the new machine has no `~/.claude/CLAUDE.md` of its own you'd overwrite.)
7. **Check it works.** `pnpm typecheck && pnpm test:unit`, then `pnpm dev`.
8. **Pick up where you left off.** Read [ROADMAP.md](./ROADMAP.md) → **Current Status**, then the latest entries at the end of [DECISIONS.md](./DECISIONS.md).

## Development

- `pnpm dev` — local dev server on http://localhost:3000. With no Shopify credentials it shows the honest "no store" states; set `PREVIEW_DEMO_MODE=1` in `.env.local` to preview with fixture products instead ([DECISIONS.md D-057](./DECISIONS.md)).
- `pnpm test:unit` — Vitest unit tests.
- `pnpm test:e2e` — main Playwright suite, run with **no** store, proving every Shopify-dependent surface degrades gracefully.
- `pnpm test:e2e:demo` — Demo Mode Playwright suite (populated catalog, including the 3D Collection Closet) ([DECISIONS.md D-090](./DECISIONS.md)).
- Both e2e suites start `pnpm dev` on :3000, or reuse a server already running there — so stop your own dev server, or make sure its Demo Mode setting matches the suite, before running one locally. Next 16 allows only one dev server per project directory.

Where the project stands and what's next: [ROADMAP.md](./ROADMAP.md) (start with "Current Status").
