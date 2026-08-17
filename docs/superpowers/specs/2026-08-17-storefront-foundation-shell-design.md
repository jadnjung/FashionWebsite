# Esque — Foundation & Storefront Shell

Status: Design approved by project owner 2026-08-17. Pending spec review before implementation planning.
Scope: ROADMAP.md Phase 0 (Project Foundation) + Phase 1 (Design System / Tokens) + Phase 3 (Core Storefront Shell)

## Context

This repo currently contains only planning documentation (`PROJECT.md`, `DESIGN_SYSTEM.md`, `INTERACTIONS.md`, `CONTENT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md`) and tooling config (`package.json`, `pnpm-lock.yaml`, `.nvmrc`, `.claude/`). No application code exists. This spec covers the first implementation pass: get a Next.js app booting with Esque's design tokens in place and a navigable storefront shell — no real commerce data yet.

Source of truth for every product/design/interaction decision below: `PROJECT.md`, `DESIGN_SYSTEM.md`, `INTERACTIONS.md`, `CONTENT.md`, `ARCHITECTURE.md`, `DECISIONS.md`. This spec does not introduce new product or brand decisions — only the technical decisions needed to implement what those documents already specify.

## Goals

- **Phase 0**: Next.js (App Router, TypeScript, strict) scaffold on pnpm; environment variable scaffolding; CI (lint, typecheck, build, Playwright).
- **Phase 1**: Design tokens (color, typography, spacing, motion) implemented as Tailwind config, matching `DESIGN_SYSTEM.md` exactly; base UI primitives (Button, Input).
- **Phase 3**: Global layout shell — Header (`ESQUE` / `MENU SEARCH ACCOUNT BAG (0)`), full-screen experimental menu, Footer, base page-transition mechanism.

End state: `pnpm dev` boots a site that looks and navigates like Esque (dark editorial theme, correct typography/spacing/color, working header/menu/footer, keyboard- and screen-reader-accessible, responsive across mobile/tablet/desktop) with no real product data behind it yet.

## Explicit non-goals (deferred)

- **Shopify integration** (ROADMAP Phase 2) — no Shopify store exists yet (confirmed with project owner). Nav/category data is hard-coded placeholder data for this pass.
- **Vercel project connection** — needs the project owner's account; CI runs but does not deploy.
- **Interactive model, custom cursor, parallax, magnetic effects** (ROADMAP Phase 9) — later phase.
- **Access gate** (ROADMAP Phase 6), **search/filters** (Phase 4), **PDP** (Phase 5), **account** (Phase 10) — later phases, not touched here.
- **VIP/Esque Private/Lookbook/3D** — explicitly deferred per `PROJECT.md §92`; not implemented.
- Final photography, final fonts, exact forest-green value, final copy — all explicitly open per `PROJECT.md §101`; placeholders used throughout, clearly labeled.

## Architecture / Project Structure

Per `ARCHITECTURE.md §3`, trimmed to what this pass needs:

```
app/
  layout.tsx          — root layout: fonts, Header, Footer, skip link
  page.tsx             — homepage placeholder (not the full editorial homepage yet — that's a later pass)
  loading.tsx          — root loading boundary
  error.tsx            — root error boundary
  globals.css          — Tailwind directives + any non-utility base styles
components/
  ui/
    Button.tsx          — primary / secondary / editorial-CTA variants
    Input.tsx
  navigation/
    Header.tsx
    FullScreenMenu.tsx
    Footer.tsx
lib/
  navigation-data.ts    — placeholder nav/category structure (see Data below)
  fonts.ts               — next/font config for functional + display typefaces
tests/
  e2e/
    smoke.spec.ts
playwright.config.ts
tailwind.config.ts
tsconfig.json            — strict: true
next.config.ts
.env.local.example        — documents the env vars from ARCHITECTURE.md §7, all placeholder
```

Not created yet (Phase 2+): `lib/shopify/`, `lib/klaviyo/`, `lib/access/`, `lib/analytics/`, `app/(access)/`, `app/(storefront)/products/`, etc. Adding them now would be scaffolding against APIs that don't exist yet.

## Design Tokens (Tailwind)

`tailwind.config.ts` encodes `DESIGN_SYSTEM.md` directly — this file *is* the implementation of the design system's token layer, not a separate parallel source of truth:

- **Colors** (§4): `esque-black: #050505`, `esque-surface: #0B0B0B`, `esque-elevated: #121212`, `esque-text: #F3F1EA`, `esque-text-secondary: #A5A5A0`, `esque-text-muted: #666662`, `esque-forest: #1F3D2B`, `esque-forest-highlight: #335B41`, `esque-error: #A74338`.
- **Type scale** (§9): `display-xl: clamp(72px, 11vw, 180px)`, `display-l: clamp(56px, 8vw, 128px)`, plus fixed sizes for h1/h2/h3/product-name/body/utility/metadata.
- **Fonts** (§6–7): two `next/font` entries — functional sans (system-ui/Helvetica-Neue-style stack as placeholder) and editorial display (a condensed/extended grotesk placeholder) — both swappable later without touching component code, per `PROJECT.md §101`'s "final fonts" being open.
- **Spacing** (§13): the 4/8/12/16/24/32/48/64/96/128 scale as Tailwind's spacing scale extension.
- **Letter spacing** (§11), **radius** (§16: 0–4px, mostly square), **easing** (§20: `cubic-bezier(0.22, 1, 0.36, 1)` as a custom `transitionTimingFunction`).

Color usage rule (§5, 80/15/5 monochrome/imagery/forest) is a design *practice*, enforced through component defaults (buttons default to white-on-black/black-on-white per §17, never forest green) and through review — not something Tailwind config can encode directly.

## Components

**Button** (`DESIGN_SYSTEM.md §17`): `variant: 'primary' | 'secondary' | 'editorial'`. Primary = `#F3F1EA` bg / `#050505` text, mostly rectangular. Secondary = transparent, thin border. Editorial = text-based (`EXPLORE COLLECTION →` pattern), no fill. Hover: subtle inversion/underline reveal per variant — CSS-only, no JS animation library needed for this.

**Input**: minimal, dark-surface styled, visible focus state (accessibility requirement, non-negotiable regardless of visual restraint elsewhere).

**Header** (`DESIGN_SYSTEM.md §24`): `72px` height, `ESQUE` left, `MENU SEARCH ACCOUNT BAG (0)` right, optional contextual center slot (unused until a collection page exists). Transparent-over-hero is deferred until there's a hero to sit over (this pass's homepage is a placeholder); starts solid/dark.

**FullScreenMenu** (`DESIGN_SYSTEM.md §25–26`): triggered by MENU, full-screen black overlay, oversized typographic categories (`NEW`, `TOPS`, `BOTTOMS`, `ETC.`, `COLLECTIONS`, `ABOUT`) from `PROJECT.md §11`'s primary navigation. Opens/closes via CSS transition (350–500ms open, faster close, per §26) — no animation library dependency for this pass. Keyboard: focus-trapped while open, `Escape` closes, first category auto-focused on open.

**Footer**: minimal utility footer per `PROJECT.md §23` (Scene 08) — links only, no editorial content yet.

**Homepage placeholder** (`app/page.tsx`, this pass only — not the final editorial homepage): centered `ESQUE` wordmark in the display typeface at `display-xl` size, with `COLLECTION 001 — IN DEVELOPMENT` beneath it in the functional typeface. This exists to prove the token system, both typefaces, and the shell render correctly together — nothing more. It is explicitly replaced when the real homepage (`DESIGN_SYSTEM.md §27–36`) is built in a later pass.

## Data

`lib/navigation-data.ts` — a single typed constant holding the primary nav structure (New / Tops / Bottoms / Etc. / Collections / About) and Tops/Bottoms/Etc. subcategories per `PROJECT.md §9`. Explicitly commented as temporary, to be replaced by Shopify collection/category data in Phase 2. This is the *only* place placeholder commerce-adjacent data lives — no mock Shopify client, no fake product objects (there's nothing yet that needs product data at the shell layer).

Bag count: local component state (`useState`, defaulting to 0), not global state — there's no cart to track yet. Will be replaced by real cart state wired to Shopify's Cart API in Phase 2; not solved with a premature global store now.

## Accessibility

- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`.
- Skip-to-content link, visually hidden until focused.
- FullScreenMenu: `role="dialog"` + `aria-modal`, focus trap, `Escape` to close, focus returns to the MENU trigger on close.
- All interactive elements (Button, nav links, menu trigger) have accessible names; icon-only controls get `aria-label`.
- Visible focus states on every interactive element (not suppressed for aesthetic reasons).
- `prefers-reduced-motion: reduce` respected via CSS media query wrapping all transition/animation declarations.

## Error / Loading / Empty States

Root `app/loading.tsx` and `app/error.tsx` established now (skeleton/ESQUE-branded loading state per `DESIGN_SYSTEM.md §64/§88` pattern; on-brand error copy per `CONTENT.md §6`) even though there's no real async data-fetching yet in this pass — establishes the pattern before Phase 2 needs it, per `PROJECT.md`'s "Handle loading, empty, error, and success states" requirement.

## Testing

Playwright config created (finally makes the existing `test:e2e` script work). One smoke spec (`tests/e2e/smoke.spec.ts`) covering:

- Homepage loads without console errors.
- Header renders with correct nav items.
- MENU opens the full-screen menu; category items are present and keyboard-reachable; `Escape` closes it and returns focus.
- Footer renders.
- Basic responsive check (mobile viewport doesn't overflow horizontally).

No unit tests this pass — there's no business logic yet to unit-test; component-level structure is simple enough that the E2E smoke test is the meaningful check per `CLAUDE.md`'s "use the lowest appropriate test level."

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`): on push/PR — `pnpm install --frozen-lockfile` → lint → typecheck → build → Playwright. No deploy step (Vercel project doesn't exist yet; added when it does).

## New Architectural Decisions to Record

To be added to `DECISIONS.md` during implementation:

- **D-009**: Tailwind CSS as the styling approach (resolves the open item in `ARCHITECTURE.md §10`).
- **D-010**: Placeholder-data-over-mock-client strategy for pre-Shopify UI work.
- **D-011**: View Transitions API (native) as the starting motion implementation for page/menu transitions, before introducing a JS animation library — per `DESIGN_SYSTEM.md §62`'s layered stack, use the cheapest tier that satisfies the need.
- Reaffirm **D-008** (root-level docs, not `/docs`) — no change, but note this session's prompt referenced `docs/PRODUCT.md`-style paths and the project owner confirmed keeping the existing root-level layout.

## Explicitly Open / Out of Scope for This Spec

- Shopify store creation, Vercel project connection — project owner's action, not part of this implementation.
- Final brand fonts, exact forest-green hex, final logo — `PROJECT.md §101`, unresolved by design (revisit later).
- The full editorial homepage (hero, interactive model, collection scenes) — `app/page.tsx` in this pass is a minimal placeholder proving the shell works, not the final homepage from `DESIGN_SYSTEM.md §27–36`.
</content>
