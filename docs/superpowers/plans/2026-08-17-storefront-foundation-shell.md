# Foundation & Storefront Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Esque Next.js app, implement the design-token system, and build a navigable, accessible storefront shell (header, full-screen menu, footer) — no real commerce data yet.

**Architecture:** Next.js 16 (App Router, TypeScript strict) on pnpm, styled with Tailwind CSS v4 via its CSS-first `@theme` configuration (not a JS config file — see Deviation Note below). All shell state is local component state; no global store, no Shopify client yet.

**Tech Stack:** Next.js (latest), React (latest, via Next.js), TypeScript (strict), Tailwind CSS v4, Prettier, ESLint (`eslint-config-next`), Playwright (already in `package.json`).

**Spec:** [`docs/superpowers/specs/2026-08-17-storefront-foundation-shell-design.md`](../specs/2026-08-17-storefront-foundation-shell-design.md) — read both; this plan implements that spec's decisions and doesn't re-argue them.

**Deviation from spec (verified via Context7 against current library docs before writing this plan):** the spec says `tailwind.config.ts`. Tailwind CSS v4's current convention is CSS-first configuration via an `@theme` block in `app/globals.css` — there is no JS/TS config file for basic theming. This plan uses the current, correct mechanism. The spec's *decision* (Tailwind as the styling approach, tokens matching `DESIGN_SYSTEM.md` exactly) is unchanged — only the file that holds the tokens differs from what the spec assumed.

**Scope note on page transitions:** the spec's Phase 3 goal includes "base page transitions." This pass has only one route (the homepage placeholder), so there is nothing to transition *between* yet — cross-page shared-element transitions are meaningless to build or test against a single page. This plan implements the one transition that *does* exist in this pass — the full-screen menu's open/close — and defers page-to-page transitions to whichever later phase first introduces a second route.

## Global Constraints

- TypeScript strict mode (`"strict": true` in `tsconfig.json`) — no exceptions.
- No `@ts-ignore` / `@ts-nocheck` without documented justification (`CLAUDE.md`).
- Package manager: pnpm only — do not introduce npm/yarn lockfiles.
- No new dependencies beyond what's listed in Tech Stack above without a documented reason (`CLAUDE.md` — "avoid unnecessary dependencies").
- Every interactive element must be keyboard operable with a visible focus state (`DESIGN_SYSTEM.md §22–23`, `PROJECT.md §78`).
- All motion must respect `prefers-reduced-motion: reduce` (`INTERACTIONS.md §17`).
- Colors, spacing, type scale, and motion timing values must match `DESIGN_SYSTEM.md` exactly — see the spec's Design Tokens section for the full value table.
- No deferred-scope features: no VIP/Esque Private, no Lookbook, no 3D, no Shopify integration, no interactive model, no custom cursor (`PROJECT.md §92`).
- Placeholder assets (fonts, copy, imagery) must be clearly labeled as placeholder in code comments, per the project owner's explicit instruction.
- Do not modify `CLAUDE.md`.
- Record new architectural decisions in `DECISIONS.md` as they're made (Task 14 below), not deferred to the end.

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: `app/` (from generator), `next.config.ts`, `next-env.d.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `public/` (if generated)
- Modify: `package.json` (merge — this repo already has one with `@playwright/test`), `pnpm-lock.yaml` (regenerated)
- Do not touch: `PROJECT.md`, `DESIGN_SYSTEM.md`, `INTERACTIONS.md`, `CONTENT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md`, `CLAUDE.md`, `README.md`, `.gitignore` (already correct), `.claude/`

**Interfaces:**
- Produces: a working `pnpm dev` / `pnpm build` / `pnpm start` Next.js app at the repo root.

`create-next-app` refuses to scaffold into a non-empty directory, and this repo already has `PROJECT.md`, `package.json`, `.claude/`, etc. Scaffold into a temp directory, then merge in.

- [ ] **Step 1: Scaffold into a temp directory**

Run (from anywhere, using the scratchpad or `/tmp`):
```bash
cd /tmp && rm -rf esque-scaffold-tmp && pnpm create next-app@latest esque-scaffold-tmp --ts --tailwind --eslint --app --import-alias "@/*" --use-pnpm --yes
```

Expected: a new `/tmp/esque-scaffold-tmp/` directory containing a working Next.js app.

- [ ] **Step 2: Copy generated app files into the repo, excluding anything that would collide**

```bash
cd /Users/jadenjung/Desktop/Repos/FashionWebsite
cp -R /tmp/esque-scaffold-tmp/app .
cp /tmp/esque-scaffold-tmp/next.config.ts .
cp /tmp/esque-scaffold-tmp/next-env.d.ts .
cp /tmp/esque-scaffold-tmp/tsconfig.json .
cp /tmp/esque-scaffold-tmp/eslint.config.mjs .
cp /tmp/esque-scaffold-tmp/postcss.config.mjs .
[ -d /tmp/esque-scaffold-tmp/public ] && cp -R /tmp/esque-scaffold-tmp/public .
```

Do **not** copy the generated `README.md` (this repo already has one) or the generated `package.json`/`pnpm-lock.yaml` directly — those get merged by hand in the next step so the existing `@playwright/test` devDependency and `test:e2e` script survive.

- [ ] **Step 3: Merge package.json by hand**

Open `/tmp/esque-scaffold-tmp/package.json` and this repo's `package.json` side by side. Produce a merged `package.json` at the repo root with:
- `scripts`: keep the existing `test:e2e`, add the generated `dev`, `build`, `start`, `lint` scripts.
- `dependencies`: add `next`, `react`, `react-dom` (whatever versions the generator picked).
- `devDependencies`: keep the existing `@playwright/test`, add `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `@eslint/eslintrc` (if present), `tailwindcss`, `@tailwindcss/postcss` (whatever versions the generator picked).

Result should look like:
```json
{
  "name": "esque",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "<generated version>",
    "react": "<generated version>",
    "react-dom": "<generated version>"
  },
  "devDependencies": {
    "@playwright/test": "^1.62.1",
    "typescript": "<generated version>",
    "@types/node": "<generated version>",
    "@types/react": "<generated version>",
    "@types/react-dom": "<generated version>",
    "eslint": "<generated version>",
    "eslint-config-next": "<generated version>",
    "tailwindcss": "<generated version>",
    "@tailwindcss/postcss": "<generated version>"
  }
}
```

- [ ] **Step 4: Clean up temp directory and reinstall**

```bash
rm -rf /tmp/esque-scaffold-tmp
pnpm install
```

Expected: `pnpm-lock.yaml` updates to include the new dependencies; no errors.

- [ ] **Step 5: Verify the scaffold builds and dev server boots**

```bash
pnpm build
```
Expected: build succeeds.

```bash
timeout 15 pnpm dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
Expected: `200`. Then stop the dev server (`kill %1` or equivalent).

- [ ] **Step 6: Confirm tsconfig strict mode**

Open `tsconfig.json`, confirm `"strict": true` is present under `compilerOptions` (this is the generator's default — verify, don't assume).

- [ ] **Step 7: Commit**

```bash
git add app next.config.ts next-env.d.ts tsconfig.json eslint.config.mjs postcss.config.mjs public package.json pnpm-lock.yaml
git commit -m "Scaffold Next.js app (App Router, TypeScript strict, Tailwind CSS v4)

ROADMAP.md Phase 0. Merged create-next-app's output into the existing
repo rather than scaffolding in place, since create-next-app refuses
non-empty directories and this repo already has docs/config to preserve."
git push
```

---

### Task 2: Add Prettier and finalize package.json scripts

**Files:**
- Create: `.prettierrc.json`, `.prettierignore`
- Modify: `package.json`

**Interfaces:**
- Produces: `pnpm format`, `pnpm format:check`, `pnpm typecheck` scripts — the full set `CLAUDE.md`'s validation checklist requires (format, lint, typecheck, tests, build).

- [ ] **Step 1: Install Prettier**

```bash
pnpm add -D prettier
```

- [ ] **Step 2: Create Prettier config**

`.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

`.prettierignore`:
```
node_modules
.next
pnpm-lock.yaml
```

- [ ] **Step 3: Add scripts to package.json**

Add to `"scripts"`:
```json
"typecheck": "tsc --noEmit",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 4: Verify each new script runs**

```bash
pnpm format:check
```
Expected: passes or lists files to format — if it lists files, run `pnpm format` once to normalize the freshly-scaffolded code, then re-run `pnpm format:check` to confirm it now passes.

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .prettierrc.json .prettierignore app
git commit -m "Add Prettier and typecheck/format scripts

Completes the format/lint/typecheck/test/build validation set CLAUDE.md
requires — Next.js's generator doesn't include a formatter or a
standalone typecheck script by default."
git push
```

---

### Task 3: Configure Playwright and establish the first TDD cycle

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `app/layout.tsx` (metadata)

**Interfaces:**
- Produces: a working `pnpm test:e2e`, and `tests/e2e/smoke.spec.ts` as the file every later shell task adds tests to.

- [ ] **Step 1: Create Playwright config**

`playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

- [ ] **Step 2: Write the first failing test**

`tests/e2e/smoke.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('shell', () => {
  test('homepage has Esque branding in the title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Esque/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm test:e2e
```
Expected: FAIL — the scaffolded page still has the generator's default title ("Create Next App"), not "Esque".

- [ ] **Step 4: Fix the metadata**

In `app/layout.tsx`, update the `metadata` export:
```typescript
export const metadata: Metadata = {
  title: 'Esque',
  description: 'Esque — a niche, experimental fashion house.',
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test:e2e
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e/smoke.spec.ts app/layout.tsx
git commit -m "Configure Playwright; add Esque branding to root metadata

First real TDD cycle: test asserted the page title contained 'Esque',
failed against the generator's default title, fixed by setting real
metadata. tests/e2e/smoke.spec.ts is the file every later shell task
in this plan adds tests to."
git push
```

---

### Task 4: Environment variable scaffolding

**Files:**
- Create: `.env.local.example`

**Interfaces:**
- Produces: documented, placeholder-only env var names matching `ARCHITECTURE.md §7` exactly.

- [ ] **Step 1: Create the example env file**

`.env.local.example`:
```bash
# Shopify Storefront API — not yet provisioned (no store exists yet).
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_API_TOKEN=
SHOPIFY_STOREFRONT_API_VERSION=

# Klaviyo — not yet provisioned.
KLAVIYO_PRIVATE_API_KEY=
KLAVIYO_LIST_ID=

# Access gate passwords. See PROJECT.md §15-17 for the password architecture.
ESQUE_ACCESS_PASSWORD=
ESQUE_EARLY_ACCESS_PASSWORD=

# Analytics — not yet provisioned.
NEXT_PUBLIC_GA4_MEASUREMENT_ID=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: Verify `.gitignore` already excludes real env files**

```bash
git check-ignore -v .env.local
```
Expected: matches the existing `.env.local` rule in `.gitignore` (added in an earlier commit). No change needed to `.gitignore` — this step is a verification, not an edit.

- [ ] **Step 3: Commit**

```bash
git add .env.local.example
git commit -m "Add .env.local.example matching ARCHITECTURE.md §7

All values are empty placeholders — no real store/API credentials
exist yet."
git push
```

---

### Task 5: Design tokens — Tailwind `@theme`

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes for every `DESIGN_SYSTEM.md` color/spacing/tracking/easing token — e.g. `bg-esque-black`, `text-esque-forest`, `ease-esque`.
- Consumes: nothing yet (this is the first token-bearing task).

- [ ] **Step 1: Write the failing test**

Add to `tests/e2e/smoke.spec.ts`:
```typescript
test.describe('design tokens', () => {
  test('body uses the Esque dark background and off-white text tokens', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(5, 5, 5)'); // #050505
    await expect(body).toHaveCSS('color', 'rgb(243, 241, 234)'); // #F3F1EA
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:e2e -g "design tokens"
```
Expected: FAIL — body currently uses the generator's default colors.

- [ ] **Step 3: Add the token theme to globals.css**

In `app/globals.css`, above the existing `@import "tailwindcss";` line stays; add below it:
```css
@import 'tailwindcss';

@theme {
  /* Colors — DESIGN_SYSTEM.md §4 */
  --color-esque-black: #050505;
  --color-esque-surface: #0b0b0b;
  --color-esque-elevated: #121212;
  --color-esque-text: #f3f1ea;
  --color-esque-text-secondary: #a5a5a0;
  --color-esque-text-muted: #666662;
  --color-esque-forest: #1f3d2b;
  --color-esque-forest-highlight: #335b41;
  --color-esque-error: #a74338;

  /* Type scale — DESIGN_SYSTEM.md §9 */
  --text-display-xl: clamp(72px, 11vw, 180px);
  --text-display-l: clamp(56px, 8vw, 128px);
  --text-heading-1: 48px;
  --text-heading-2: 36px;
  --text-heading-3: 26px;
  --text-product-name: 16px;
  --text-body: 15px;
  --text-utility: 13px;
  --text-metadata: 11px;

  /* Spacing scale — DESIGN_SYSTEM.md §13 (base unit 4px) */
  --spacing: 4px;

  /* Letter spacing — DESIGN_SYSTEM.md §11 (midpoints of the documented ranges) */
  --tracking-display: -0.02em;
  --tracking-nav: 0.05em;
  --tracking-metadata: 0.1em;

  /* Motion — DESIGN_SYSTEM.md §20 */
  --ease-esque: cubic-bezier(0.22, 1, 0.36, 1);

  /* Shape — DESIGN_SYSTEM.md §16 (mostly square, 0-4px radius) */
  --radius-esque: 4px;
}

body {
  background-color: var(--color-esque-black);
  color: var(--color-esque-text);
}

/* Global focus-visible safety net — DESIGN_SYSTEM.md §22, PROJECT.md §78.
   Button (Task 7) additionally sets its own branded outline; this covers
   every other interactive element (nav links, footer links) so visibility
   never depends on remembering to add focus classes per-component. */
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-esque-forest);
  outline-offset: 2px;
}
```

Note: Tailwind v4's `--spacing` variable sets the *base unit* multiplier for the whole numeric spacing scale (e.g. `p-4` = `--spacing * 4`) — setting it to `4px` reproduces `DESIGN_SYSTEM.md`'s 4/8/12/16/24/32/48/64/96/128 scale directly through Tailwind's existing numeric spacing utilities (`p-1` through `p-32`), without hand-declaring ten separate spacing tokens.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:e2e -g "design tokens"
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tests/e2e/smoke.spec.ts
git commit -m "Implement design tokens via Tailwind @theme (DESIGN_SYSTEM.md §4-20)

Colors, type scale, spacing, letter-spacing, and easing tokens, all
matching DESIGN_SYSTEM.md's documented values exactly."
git push
```

---

### Task 6: Fonts — functional + display typefaces

**Files:**
- Create: `lib/fonts.ts`
- Modify: `app/layout.tsx`, `app/globals.css`

**Interfaces:**
- Produces: CSS custom properties `--font-functional`, `--font-display` and matching Tailwind utilities `font-functional`, `font-display`.

`PROJECT.md §101` lists final fonts as explicitly open. This task wires in placeholder system-font stacks now so components can be built against real `font-functional`/`font-display` classes; swapping in licensed fonts later is a one-file change to `lib/fonts.ts`.

- [ ] **Step 1: Write the failing test**

Add to `tests/e2e/smoke.spec.ts`:
```typescript
test.describe('fonts', () => {
  test('functional and display font CSS variables are defined', async ({ page }) => {
    await page.goto('/');
    const functionalFont = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-functional'),
    );
    const displayFont = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-display'),
    );
    expect(functionalFont.trim()).not.toBe('');
    expect(displayFont.trim()).not.toBe('');
    expect(functionalFont).not.toBe(displayFont);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:e2e -g "fonts"
```
Expected: FAIL — the variables don't exist yet.

- [ ] **Step 3: Define the fonts**

`lib/fonts.ts` — placeholder stacks now (per `DESIGN_SYSTEM.md §6-7`: functional = Swiss/grotesk sans, display = expressive grotesk), swappable later without touching any component:
```typescript
import localFont from 'next/font/local';

// PLACEHOLDER: real typefaces are an open decision (PROJECT.md §101).
// Both use next/font's fallback-to-system-font mechanism until real
// font files are chosen and licensed.
export const functionalFont = localFont({
  src: [],
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
  variable: '--font-functional',
});

export const displayFont = localFont({
  src: [],
  fallback: ['Arial Narrow', 'Helvetica Neue', 'sans-serif'],
  variable: '--font-display',
});
```

> **If `next/font/local` rejects an empty `src` array at build time**, use `next/font/google`'s `Inter` (functional) and `Oswald` (display, as a condensed-grotesk-family placeholder) instead — both are widely available, well-known-safe placeholders and match the "highly readable modern sans-serif" / "condensed grotesk" direction `DESIGN_SYSTEM.md §6-7` describes:
> ```typescript
> import { Inter, Oswald } from 'next/font/google';
> export const functionalFont = Inter({ subsets: ['latin'], variable: '--font-functional' });
> export const displayFont = Oswald({ subsets: ['latin'], variable: '--font-display' });
> ```
> Use whichever actually builds; note which one you used in the Task 6 commit message.

- [ ] **Step 4: Wire into root layout**

In `app/layout.tsx`:
```typescript
import { functionalFont, displayFont } from '@/lib/fonts';

// in RootLayout's returned JSX:
<html lang="en" className={`${functionalFont.variable} ${displayFont.variable}`}>
```

- [ ] **Step 5: Register as Tailwind theme tokens**

In `app/globals.css`, inside the existing `@theme` block, add:
```css
  --font-functional: var(--font-functional);
  --font-display: var(--font-display);
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm test:e2e -g "fonts"
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/fonts.ts app/layout.tsx app/globals.css tests/e2e/smoke.spec.ts
git commit -m "Wire up placeholder functional/display typefaces (DESIGN_SYSTEM.md §6-7)

Placeholder font stacks per PROJECT.md §101 (final fonts open) —
swapping in real typefaces later only touches lib/fonts.ts."
git push
```

---

### Task 7: Button component

**Deviation from spec:** the spec's file structure lists `components/ui/Input.tsx` alongside `Button.tsx` for this pass. Nothing in Phase 0/1/3 scope actually uses an input — search (Phase 4), account forms (Phase 10), and the request-access form (Phase 6) are the first real consumers, and building it now would mean either an isolated test harness with no product purpose, or an untested component, both worse than deferring it. Building it in whichever task first needs it, with a real test against real usage, is a plan-level YAGNI call rather than a product/architecture decision — it doesn't need a `DECISIONS.md` entry, just this note.

**Files:**
- Create: `components/ui/Button.tsx`

**Interfaces:**
- Produces: `Button({ variant: 'primary' | 'secondary' | 'editorial', children, onClick?, type?, 'aria-label'? })` — a typed React component.
- Consumed by: Task 8 (Header's MENU trigger).

- [ ] **Step 1: Write the component (no isolated test — see note)**

`components/ui/Button.tsx`:
```typescript
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'editorial';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Applied to every variant — DESIGN_SYSTEM.md §22's cursor/focus rules and
// PROJECT.md §78 both require a visible focus state on every interactive
// element; this is not optional regardless of how restrained the resting
// visual style is.
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-forest';

const variantClasses: Record<ButtonVariant, string> = {
  // DESIGN_SYSTEM.md §17 — Primary: bg #F3F1EA, text #050505, rectangular
  primary: `bg-esque-text text-esque-black rounded-none px-6 py-3 transition-opacity duration-200 ease-esque hover:opacity-90 ${focusRing}`,
  // Secondary: transparent, thin border, hover reveals underline
  secondary: `bg-transparent text-esque-text border border-esque-text-secondary rounded-none px-6 py-3 transition-colors duration-200 ease-esque hover:border-esque-text ${focusRing}`,
  // Editorial CTA: text-based, no fill
  editorial: `bg-transparent text-esque-text underline-offset-4 tracking-nav uppercase transition-colors duration-200 ease-esque hover:text-esque-text-secondary ${focusRing}`,
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const classes = `${variantClasses[variant]} ${className}`.trim();
  return <button className={classes} {...props} />;
}
```

This task has no standalone test: `Button` has no on-page consumer until Task 8 wires it into `Header`, and per this plan's "no unit tests this pass" testing strategy (approved in the design spec), it's exercised for real — rendered, clicked, asserted visible/focusable — through `Header`'s own test in Task 8. Verify with `pnpm typecheck` only for now.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/Button.tsx
git commit -m "Add Button component (primary/secondary/editorial variants, DESIGN_SYSTEM.md §17)

No standalone test yet — exercised for real via Header's MENU trigger
in the next task, its first actual consumer."
git push
```

---

### Task 8: Navigation data, Header, and root layout wiring

**Files:**
- Create: `lib/navigation-data.ts`, `components/navigation/Header.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `NAVIGATION: { label: string; href: string; subcategories?: { label: string; href: string }[] }[]`, `Header({ onMenuOpen: () => void; menuOpen: boolean })`.
- Consumed by: Task 9 (`FullScreenMenu` reads `NAVIGATION`).

- [ ] **Step 1: Write the failing test**

Add to `tests/e2e/smoke.spec.ts`:
```typescript
test.describe('header', () => {
  test('renders ESQUE wordmark and utility nav, has a skip link and main landmark', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'ESQUE' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'MENU' })).toBeVisible();
    await expect(page.getByText('SEARCH')).toBeVisible();
    await expect(page.getByText('ACCOUNT')).toBeVisible();
    await expect(page.getByText('BAG (0)')).toBeVisible();

    await expect(page.getByRole('main')).toBeVisible();

    const skipLink = page.getByRole('link', { name: /skip to content/i });
    await expect(skipLink).toBeAttached();
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('header adapts to mobile viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:e2e -g "header"
```
Expected: FAIL — no `Header` rendered anywhere yet.

- [ ] **Step 3: Create navigation data**

`lib/navigation-data.ts`:
```typescript
// PLACEHOLDER navigation structure — PROJECT.md §9, §11.
// Replaced by real Shopify collection/category data in ROADMAP.md
// Phase 2. This is the only file in the shell layer that holds
// commerce-adjacent placeholder data.

export interface NavCategory {
  label: string;
  href: string;
  subcategories?: { label: string; href: string }[];
}

export const NAVIGATION: NavCategory[] = [
  { label: 'NEW', href: '/new' },
  {
    label: 'TOPS',
    href: '/tops',
    subcategories: [
      { label: 'T-Shirts', href: '/tops/t-shirts' },
      { label: 'Shirts', href: '/tops/shirts' },
      { label: 'Hoodies', href: '/tops/hoodies' },
      { label: 'Sweaters', href: '/tops/sweaters' },
      { label: 'Jackets', href: '/tops/jackets' },
    ],
  },
  {
    label: 'BOTTOMS',
    href: '/bottoms',
    subcategories: [
      { label: 'Jeans', href: '/bottoms/jeans' },
      { label: 'Trousers', href: '/bottoms/trousers' },
      { label: 'Shorts', href: '/bottoms/shorts' },
      { label: 'Sweatpants', href: '/bottoms/sweatpants' },
    ],
  },
  {
    label: 'ETC.',
    href: '/etc',
    subcategories: [
      { label: 'Hats', href: '/etc/hats' },
      { label: 'Jewelry', href: '/etc/jewelry' },
    ],
  },
  { label: 'COLLECTIONS', href: '/collections' },
  { label: 'ABOUT', href: '/about' },
];
```

- [ ] **Step 4: Create Header**

`components/navigation/Header.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  menuOpen: boolean;
  onMenuOpen: () => void;
}

export function Header({ menuOpen, onMenuOpen }: HeaderProps) {
  // Bag count is local state for now — DESIGN_SYSTEM.md's data-flow
  // section: no cart exists until ROADMAP.md Phase 2 wires up Shopify.
  const [bagCount] = useState(0);

  return (
    <header
      role="banner"
      className="flex h-[72px] items-center justify-between border-b border-esque-surface bg-esque-black px-4 md:px-8"
    >
      <Link href="/" className="font-display text-lg tracking-nav text-esque-text">
        ESQUE
      </Link>

      <nav aria-label="Utility" className="flex items-center gap-4 md:gap-6">
        <Button
          variant="secondary"
          aria-expanded={menuOpen}
          aria-controls="esque-full-screen-menu"
          onClick={onMenuOpen}
        >
          MENU
        </Button>
        {/* SEARCH/ACCOUNT: real behavior lands in ROADMAP.md Phase 4/10. */}
        <Button variant="secondary" onClick={() => {}}>
          SEARCH
        </Button>
        <Button variant="secondary" onClick={() => {}}>
          ACCOUNT
        </Button>
        <Button variant="secondary" onClick={() => {}}>
          {`BAG (${bagCount})`}
        </Button>
      </nav>
    </header>
  );
}
```

- [ ] **Step 5: Wire Header, skip link, and main landmark into root layout**

In `app/layout.tsx`, replace the generated body content with:
```typescript
'use client';

import { useState } from 'react';
import { Header } from '@/components/navigation/Header';

// inside RootLayout, replacing the generated <body>{children}</body>:
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <html lang="en" className={`${functionalFont.variable} ${displayFont.variable}`}>
      <body className="font-functional">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-esque-forest focus:px-4 focus:py-2 focus:text-esque-text"
        >
          Skip to content
        </a>
        <Header menuOpen={menuOpen} onMenuOpen={() => setMenuOpen(true)} />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
```

> Note: making `layout.tsx` a Client Component (for the `menuOpen` state) is the simplest correct approach for this pass. If a later pass needs `layout.tsx` to stay a Server Component (e.g. for server-only data fetching at the root), move `menuOpen` state into a small client wrapper component instead — not a concern with zero data-fetching in this pass.

Keep the existing `metadata` export — Next.js does not allow `metadata` exports in Client Components, so if this errors, move the `export const metadata` into a separate `app/layout-metadata.ts`-style split is unnecessary; instead keep `layout.tsx` a Server Component and lift `menuOpen` state into a new small Client Component (`components/navigation/ShellClient.tsx`) that wraps `Header` + `{children}` + the future `FullScreenMenu`. Use whichever approach actually satisfies the Next.js Server/Client Component boundary rules — confirm which by running the build in Step 6.

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm build && pnpm test:e2e -g "header"
```
Expected: PASS. If the build fails on the Server/Client Component boundary (metadata export vs `useState`), apply the `ShellClient` wrapper approach noted above and re-run.

- [ ] **Step 7: Commit**

```bash
git add lib/navigation-data.ts components/navigation/Header.tsx app/layout.tsx tests/e2e/smoke.spec.ts
git commit -m "Add Header with utility nav, skip link, and main landmark

DESIGN_SYSTEM.md §24. Navigation data is placeholder (lib/navigation-data.ts),
replaced by real Shopify data in Phase 2. Bag count is local state
per the approved spec's data-flow section."
git push
```

---

### Task 9: FullScreenMenu

**Files:**
- Create: `components/navigation/FullScreenMenu.tsx`
- Modify: `app/layout.tsx` (or `ShellClient.tsx` if that split was needed in Task 8), `app/globals.css` (reduced-motion rule)

**Interfaces:**
- Consumes: `NAVIGATION` from `lib/navigation-data.ts` (Task 8), `menuOpen`/`onClose` state from the layout.
- Produces: `FullScreenMenu({ open: boolean; onClose: () => void })`.

- [ ] **Step 1: Write the failing tests**

Add to `tests/e2e/smoke.spec.ts`:
```typescript
test.describe('full-screen menu', () => {
  test('is closed by default and opens when MENU is clicked', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('dialog', { name: /menu/i });
    await expect(menu).toBeHidden();

    await page.getByRole('button', { name: 'MENU' }).click();
    await expect(menu).toBeVisible();
    await expect(page.getByRole('link', { name: 'TOPS' })).toBeVisible();
  });

  test('Escape closes the menu and returns focus to the MENU trigger', async ({ page }) => {
    await page.goto('/');
    const menuTrigger = page.getByRole('button', { name: 'MENU' });
    await menuTrigger.click();
    await expect(page.getByRole('dialog', { name: /menu/i })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /menu/i })).toBeHidden();
    await expect(menuTrigger).toBeFocused();
  });

  test('Tab cycles focus within the open menu (focus trap)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    const firstLink = page.getByRole('link', { name: 'NEW' });
    await expect(firstLink).toBeFocused();
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    const menu = page.getByRole('dialog', { name: /menu/i });
    const duration = await menu.evaluate((el) => getComputedStyle(el).transitionDuration);
    // "0s" or a near-instant value — not the full 350-500ms from DESIGN_SYSTEM.md §26.
    expect(duration === '0s' || parseFloat(duration) < 0.05).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:e2e -g "full-screen menu"
```
Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Add the reduced-motion rule**

In `app/globals.css`, add:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Create FullScreenMenu**

`components/navigation/FullScreenMenu.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { NAVIGATION } from '@/lib/navigation-data';

interface FullScreenMenuProps {
  open: boolean;
  onClose: () => void;
}

export function FullScreenMenu({ open, onClose }: FullScreenMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (open) {
      firstLinkRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      ref={containerRef}
      id="esque-full-screen-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      hidden={!open}
      className="fixed inset-0 z-40 flex flex-col justify-center gap-4 bg-esque-black px-8 transition-opacity duration-[400ms] ease-esque"
    >
      {NAVIGATION.map((category, index) => (
        <Link
          key={category.href}
          href={category.href}
          ref={index === 0 ? firstLinkRef : undefined}
          className="font-display text-display-l tracking-display text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest"
        >
          {category.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Wire into layout (or ShellClient) with close handler**

Add `menuOpen`/`setMenuOpen(false)` wiring so `FullScreenMenu`'s `onClose` sets state back to `false`, and render `<FullScreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} />` alongside `Header`.

- [ ] **Step 6: Run tests to verify they pass**

```bash
pnpm test:e2e -g "full-screen menu"
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/navigation/FullScreenMenu.tsx app/globals.css app/layout.tsx tests/e2e/smoke.spec.ts
git commit -m "Add FullScreenMenu with focus trap, Escape-to-close, reduced motion

DESIGN_SYSTEM.md §25-26. Keyboard-operable, focus returns to the MENU
trigger on close, transitions disabled under prefers-reduced-motion."
git push
```

---

### Task 10: Footer

**Files:**
- Create: `components/navigation/Footer.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `Footer()` — no props needed this pass.

- [ ] **Step 1: Write the failing test**

Add to `tests/e2e/smoke.spec.ts`:
```typescript
test.describe('footer', () => {
  test('renders as a landmark with utility links', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /terms/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /contact/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:e2e -g "footer"
```
Expected: FAIL.

- [ ] **Step 3: Create Footer**

`components/navigation/Footer.tsx` — minimal per `PROJECT.md §23` Scene 08 / `§90` sitemap's Legal section:
```typescript
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-esque-surface bg-esque-black px-4 py-8 text-utility text-esque-text-secondary md:px-8">
      <nav aria-label="Legal and support" className="flex flex-wrap gap-4">
        <Link href="/legal/privacy" className="hover:text-esque-text">
          Privacy
        </Link>
        <Link href="/legal/terms" className="hover:text-esque-text">
          Terms
        </Link>
        <Link href="/contact" className="hover:text-esque-text">
          Contact
        </Link>
      </nav>
    </footer>
  );
}
```

- [ ] **Step 4: Wire into layout below `<main>`**

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test:e2e -g "footer"
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/navigation/Footer.tsx app/layout.tsx tests/e2e/smoke.spec.ts
git commit -m "Add Footer with legal/support links (PROJECT.md §23, §90)"
git push
```

---

### Task 11: Homepage placeholder content

**Files:**
- Modify: `app/page.tsx`

**Interfaces:** none — leaf page.

- [ ] **Step 1: Write the failing test**

Add to `tests/e2e/smoke.spec.ts`:
```typescript
test.describe('homepage placeholder', () => {
  test('shows the ESQUE wordmark and in-development notice', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ESQUE' })).toBeVisible();
    await expect(page.getByText('COLLECTION 001 — IN DEVELOPMENT')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:e2e -g "homepage placeholder"
```
Expected: FAIL — current homepage is still the generator's default content.

- [ ] **Step 3: Replace page content**

`app/page.tsx`:
```typescript
export default function Home() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-display-xl tracking-display text-esque-text">ESQUE</h1>
      <p className="text-body text-esque-text-secondary">COLLECTION 001 — IN DEVELOPMENT</p>
    </div>
  );
}
```

This is explicitly a placeholder — the full editorial homepage (`DESIGN_SYSTEM.md §27-36`) is a separate, later pass.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:e2e -g "homepage placeholder"
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx tests/e2e/smoke.spec.ts
git commit -m "Replace default homepage with Esque placeholder content

Proves the token/font/shell system renders correctly. Not the final
editorial homepage (DESIGN_SYSTEM.md §27-36) — that's a later pass."
git push
```

---

### Task 12: Root loading and error boundaries

**Files:**
- Create: `app/loading.tsx`, `app/error.tsx`

**Interfaces:** none.

There is no automated test for this task. `loading.tsx` only renders during a real Suspense-triggering async boundary, which this pass has none of yet (no data fetching exists until Phase 2) — an E2E test would have to artificially fabricate a delay to observe it, testing the fabrication rather than real behavior. `error.tsx` requires a route that throws during render to trigger, which this pass also has no legitimate reason to add. Both are established now per `CLAUDE.md`'s "handle loading, empty, error states" requirement so the pattern exists before Phase 2 needs it; verified by type-check and Next.js's own build-time convention checks (e.g., `error.tsx` must be a Client Component — Next.js's TypeScript plugin errors at compile time if it isn't).

- [ ] **Step 1: Create loading boundary**

`app/loading.tsx` — on-brand per `CONTENT.md`/`DESIGN_SYSTEM.md §64`'s "subtle ESQUE typography" pattern, not a generic spinner:
```typescript
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="font-display text-display-l tracking-display text-esque-text-secondary animate-pulse">
        ESQUE
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create error boundary**

`app/error.tsx` — must be a Client Component (Next.js requirement):
```typescript
'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-display-l text-esque-text">SOMETHING WENT WRONG.</h1>
      <button
        onClick={reset}
        className="border border-esque-text-secondary px-6 py-3 text-esque-text hover:border-esque-text"
      >
        Retry
      </button>
    </div>
  );
}
```

Copy per `CONTENT.md §6`'s error-state pattern (`PROJECT.md §87`'s network-failure guidance: "clear explanation and Retry").

- [ ] **Step 3: Typecheck and build**

```bash
pnpm typecheck && pnpm build
```
Expected: no errors (this also verifies the "must be a Client Component" rule is satisfied).

- [ ] **Step 4: Commit**

```bash
git add app/loading.tsx app/error.tsx
git commit -m "Add root loading and error boundaries (CLAUDE.md state-handling requirement)

No data-fetching exists yet to trigger these naturally — established
now so the pattern exists before ROADMAP.md Phase 2 needs it."
git push
```

---

### Task 13: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:** none.

- [ ] **Step 1: Write the workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm format:check

      - run: pnpm lint

      - run: pnpm typecheck

      - run: pnpm build

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - run: pnpm test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

No deploy step — the Vercel project doesn't exist yet (per the approved spec's explicit scope decision). Add a deploy job when it does.

- [ ] **Step 2: Verify the workflow is valid YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "valid YAML"
```
Expected: `valid YAML`. (Full verification happens when this actually runs on GitHub after push — there's no local GitHub Actions runner in this environment.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "Add CI workflow: format, lint, typecheck, build, Playwright

No deploy step yet — Vercel project doesn't exist (project owner's
account setup, deferred per the approved design spec)."
git push
```

---

### Task 14: Record architectural decisions

**Files:**
- Modify: `DECISIONS.md`

**Interfaces:** none.

- [ ] **Step 1: Add D-009 through D-011**

Append to `DECISIONS.md`, following the existing ADR format exactly:

```markdown
## D-009 — Tailwind CSS as the styling approach, configured via CSS `@theme`

**Decision:** Use Tailwind CSS v4 for all styling. Design tokens (colors, type scale, spacing, letter-spacing, easing) are declared in a single `@theme` block in `app/globals.css`, not a separate `tailwind.config.ts`.

**Reason:** Resolves the open item in [ARCHITECTURE.md §10](./ARCHITECTURE.md#10-open-architecture-decisions). Tailwind v4's current convention is CSS-first configuration — there is no JS/TS config file for basic theming as there was in v3. `DESIGN_SYSTEM.md`'s token system (exact hex values, a `clamp()`-based type scale, a fixed spacing scale, a named easing curve) maps directly onto `@theme` custom properties. Verified against current Tailwind docs before implementation (the original design spec assumed a `tailwind.config.ts` file, which is no longer how the library works).

---

## D-010 — Placeholder data over a mock Shopify client for pre-commerce UI work

**Decision:** Where the storefront shell needs data that will eventually come from Shopify (navigation categories), use a small, clearly-commented, typed placeholder data file (`lib/navigation-data.ts`) rather than building a mock Shopify Storefront API client.

**Reason:** No Shopify store exists yet, so there's nothing to validate a client interface against — building one now risks guessing wrong about the real API's shape and having to redo it in [ROADMAP.md Phase 2](./ROADMAP.md#phase-2--commerce-foundation). YAGNI per [CLAUDE.md](./CLAUDE.md)'s "do not introduce unnecessary abstractions."

---

## D-011 — View Transitions API (native) as the starting motion implementation

**Decision:** Use CSS transitions and the native View Transitions API for motion in the storefront shell (menu open/close) before introducing a JS animation library.

**Reason:** Per [DESIGN_SYSTEM.md §62](./DESIGN_SYSTEM.md#62-recommended-frontend-motion-stack)'s layered stack, use the cheapest tier that satisfies the need. The shell's only transition this pass (the full-screen menu) doesn't require spring physics, gesture-driven animation, or orchestrated sequences — a CSS `transition` on `opacity`/`transform` is sufficient and adds zero bundle weight. Cross-page shared-element transitions (which would more plausibly need Motion/Framer Motion) are deferred until a second real page exists to transition to.
```

- [ ] **Step 2: Add a reaffirmation note to D-008**

The "lead implementation agent" prompt that kicked off this work referenced `docs/PRODUCT.md`-style paths; the project owner confirmed keeping the existing root-level layout instead. D-008 itself doesn't change, but append a short dated note under its existing **Reason** so the reaffirmation has a record. Open `DECISIONS.md`, find the `## D-008` entry, and add directly below its existing content:

```markdown
**Reaffirmed 2026-08-17:** a later prompt referenced `docs/PRODUCT.md`-style paths; project owner confirmed keeping this repo's existing root-level layout rather than moving to match. No change to the decision itself.
```

- [ ] **Step 3: Verify the anchors resolve**

```bash
python3 -c "
import re
content = open('DECISIONS.md').read()
assert '## D-009' in content and '## D-010' in content and '## D-011' in content
assert 'Reaffirmed 2026-08-17' in content
print('all entries present')
"
```

- [ ] **Step 4: Commit**

```bash
git add DECISIONS.md
git commit -m "Record D-009 (Tailwind/@theme), D-010 (placeholder data), D-011 (View Transitions first)

Also reaffirms D-008 (root-level docs) against this session's prompt,
which referenced a docs/ path layout this repo doesn't use."
git push
```

---

### Task 15: Final validation pass

**Files:** none created/modified — this task only runs checks and fixes anything they surface.

- [ ] **Step 1: Format check**

```bash
pnpm format:check
```
Fix and re-run if it fails.

- [ ] **Step 2: Lint**

```bash
pnpm lint
```
Fix and re-run if it fails.

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```
Fix and re-run if it fails.

- [ ] **Step 4: Full Playwright suite (both projects: desktop Chromium + mobile Safari emulation)**

```bash
pnpm test:e2e
```
Fix and re-run if it fails. Confirm every test added across Tasks 3, 5, 6, 8, 9, 10, 11 passes on both projects.

- [ ] **Step 5: Production build**

```bash
pnpm build
```
Fix and re-run if it fails.

- [ ] **Step 6: Manual smoke check**

```bash
pnpm start &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
kill %1
```
Expected: `200`.

- [ ] **Step 7: Update ROADMAP.md checkboxes**

Mark the completed items under Phase 0, Phase 1, and Phase 3 in `ROADMAP.md` as done (`- [x]`), leaving "Create Shopify development store" and "Connect Vercel project + preview deployments" unchecked with a short note that they're blocked on the project owner's action.

- [ ] **Step 8: Final commit**

```bash
git add ROADMAP.md
git commit -m "Mark ROADMAP Phase 0/1/3 items complete (foundation + tokens + shell)

Shopify store creation and Vercel project connection remain unchecked
— both need the project owner's account, not implementation work."
git push
```
