# Esque — Access Gate

Status: Design approved by project owner 2026-08-22. Pending spec review before implementation planning.
Scope: ROADMAP.md Phase 6 (Access Gate) in full — password entry, access persistence, Request Access → Klaviyo, SEO/crawlability preservation.

## Context

The storefront shell (Phase 0/1/3) and the Shopify commerce data layer (Phase 2, narrowed) are both complete and pushed. No product/collection pages exist yet (Phase 4/5), so this pass builds the gate mechanism and its own page — there's nothing downstream for it to protect yet beyond the existing homepage placeholder.

Source of truth: `PROJECT.md` §12-17 (entry experience, design, motion concept, password architecture, drop-specific early access, incorrect-password experience), `DESIGN_SYSTEM.md` §53-57, 67 (layout, copy, incorrect-password animation, persistence, SEO), `CONTENT.md` §3-5 (exact copy), `ARCHITECTURE.md` §6-8 (gate architecture, env vars, Klaviyo integration point), `DECISIONS.md` D-005 (UI-layer gate, not an SEO wall), D-006 (layered motion stack).

## Goals

ROADMAP.md Phase 6's four items, in full:
- Password entry UI + branded incorrect-password microcopy
- Access cookie (~30 day persistence), separate VIP/early-access claim
- Request Access form → Klaviyo list + password email
- Confirm the SEO rule: product/collection routes stay crawlable regardless of access state

Plus, per the project owner's explicit choice this pass: the full entrance motion sequence from `PROJECT.md` §13-14 / `DESIGN_SYSTEM.md` §53 (layered garment-silhouette imagery, typography entrance, cursor-reactive movement) using placeholder imagery — not deferred to a later phase.

## Explicit Non-Goals (deferred)

- **Esque Private.** `PROJECT.md` §15 itself marks this "reserved for future development." Not scaffolded — only the two tiers ROADMAP.md Phase 6 actually names (General Access, VIP/early-access) are built.
- **Real time-boxed early-access windows** (a specific drop date/time gating when the early-access password activates or expires). Collection 001's launch date is listed as an open product decision (`PROJECT.md` §101) — there's no real date to gate against yet. This pass builds the *mechanism* (a working early-access password and a separate cookie claim), not a scheduling system with nothing real to schedule.
- **Model footage.** `PROJECT.md` §13's own wording conditions this on production assets existing ("model footage when production assets become available") — excluded regardless of how the rest of the entrance sequence is scoped.
- **Rate limiting, lockout, hashed/timing-safe password comparison.** `CONTENT.md` §5 and `DECISIONS.md` D-005 are explicit: this is a brand gate, not a security boundary, and unlimited attempts are intentional. Adding security hardening here would be over-engineering against the document's own stated intent.
- **Any product/collection page to actually test crawlability against.** None exist yet (Phase 4/5). This pass verifies the *architecture* correctly allows crawler traffic through regardless of cookie state (tested against the existing homepage placeholder and the access page itself), not a real catalog page.

## Architecture

### Gate enforcement: Proxy (not Middleware)

Next.js renamed Middleware to Proxy as of the version this project pins (confirmed against current Next.js docs, not assumed): the file is `proxy.ts` at the repo root, exporting `export function proxy(request: NextRequest)`, and it now runs on the Node.js runtime rather than Edge. The old `middleware.ts`/`export function middleware()` convention is deprecated (Next.js ships a codemod to migrate existing projects off it).

```
proxy.ts
```

Logic:
1. If the request's `User-Agent` matches a known bot/crawler (via `isbot`, a small, actively-maintained, purpose-built library — 22M weekly downloads, regularly updated crawler-pattern list; hand-rolling and maintaining this list ourselves would be the worse choice given SEO correctness depends on it), `NextResponse.next()` — no gate, ever, regardless of cookie state. This is what satisfies `DECISIONS.md` D-005.
2. Otherwise, check for either access cookie (`esque_access` or `esque_vip_access`). Present → `NextResponse.next()`. Absent → `NextResponse.redirect('/access')`.
3. `config.matcher` excludes `/access` itself (no redirect loop), static assets, and Next.js internals.

### Route structure

Per `ARCHITECTURE.md` §3's target structure, the access gate lives in its own route group, outside the main shell (no Header/FullScreenMenu/Footer):

```
app/
  (access)/
    access/
      page.tsx           — the gate page (Server Component: renders the entrance motion + both forms)
      actions.ts          — Server Actions: validatePassword, submitRequestAccess
      EntranceMotion.tsx   — Client Component: layered silhouettes + typography + cursor-reactive motion
      AccessForm.tsx       — Client Component: password field, calls validatePassword, owns the incorrect-password animation/rotating-microcopy state
      RequestAccessForm.tsx — Client Component: first name/email/consent, calls submitRequestAccess
lib/
  klaviyo/
    client.ts             — lazy Klaviyo client, same "throws only when called, never at import" pattern as lib/shopify/client.ts
    subscribe.ts           — subscribeToAccessList(email, firstName): Promise<void>
proxy.ts
```

### Password validation and cookies

`actions.ts`'s `validatePassword(password: string)` Server Action compares the submitted value against `process.env.ESQUE_ACCESS_PASSWORD` and `process.env.ESQUE_EARLY_ACCESS_PASSWORD` (plain string equality — see Explicit Non-Goals for why nothing stronger is warranted here). On a match:
- General password → sets `esque_access` (httpOnly, secure, sameSite=lax, ~30 days), redirects to `/`.
- Early-access password → sets `esque_access` **and** a separate `esque_vip_access` claim (same attributes, same ~30-day placeholder duration — see Non-Goals on why this isn't tied to a real schedule yet), redirects to `/`.
- No match → returns a result the client-side `AccessForm` uses to trigger the incorrect-password state (see Content below) without a full page reload.

The proxy checks for *either* cookie — VIP access is a superset of general access for gating purposes, not a separate gate.

### Klaviyo integration

`KLAVIYO_PRIVATE_API_KEY`/`KLAVIYO_LIST_ID` are currently empty placeholders — the same situation Shopify was in before its store existed. Applying the identical, already-proven pattern: `lib/klaviyo/client.ts` exports a function that checks configuration and throws a clear `Error` only when actually called (never at import time), so the rest of the app never breaks just because Klaviyo isn't configured yet.

Calling Klaviyo's REST API directly via `fetch` — confirmed via their current docs: `POST https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/`, `Authorization: Klaviyo-API-Key <key>`, a `revision` header, JSON:API-shaped body naming the profile's email and the target list ID via `relationships.list.data.id`. This is one simple call; their full Node SDK isn't justified for this single use.

`submitRequestAccess(firstName, email)` Server Action calls `subscribeToAccessList`, which throws through to whatever the caller does with it (see Error Handling).

### Entrance motion

Using `motion` (ARCHITECTURE.md's already-approved tech-stack choice for component/layout motion — Framer Motion's current package name, confirmed via their current docs; never installed before now since nothing prior needed JS-driven motion). Per `DESIGN_SYSTEM.md` §53's layer order (black base → garment-silhouette layer → giant ESQUE typography → password UI — model layer excluded per Non-Goals):

- Garment silhouettes: simple abstract SVG shapes in the existing palette (not real photography — see the project owner's answer on placeholder imagery), positioned at different depths, each offset subtly by cursor position (`useMotionValue` tracking pointer position, `useTransform` mapping it to a small per-layer translate, closer layers moving more than distant ones for a parallax feel).
- Typography: ESQUE fades/scales in on mount, per `PROJECT.md` §14's sequence, kept quick per §14's own explicit instruction ("Motion must remain quick... never become an obstacle for returning users").
- `prefers-reduced-motion`: per this project's established, consistent pattern (every prior motion feature respects it), cursor-reactive movement and the entrance sequence are both disabled/instant under reduced motion — silhouettes and typography simply appear in their final position with no animation.

### Incorrect-password animation

Per `DESIGN_SYSTEM.md` §56: on a failed attempt, the field shifts ~3-5px, the message text briefly splits horizontally, then a randomly-selected line from `CONTENT.md` §5's five approved variants appears (avoiding an immediate repeat of the last one shown). Explicitly avoid aggressive shaking, per the spec's own instruction. This is `AccessForm.tsx`'s own local state — no full page reload, no navigation.

## Content

Exact copy from `CONTENT.md` §3-4, used verbatim — not paraphrased:

- Entry: `ENTER ESQUE`, password field, `ENTER` / `REQUEST ACCESS` buttons, supporting text `ACCESS TO CURRENT COLLECTIONS.`
- Request Access form: fields `FIRST NAME` / `EMAIL`, consent checkbox "I agree to receive Esque emails, including access and collection updates.", CTA `REQUEST ACCESS`, confirmation `ACCESS SENT.` / `CHECK YOUR EMAIL.`
- Incorrect password (rotate among all five): `NOT THIS ONE.` / `ACCESS NOT RECOGNIZED.` / `TRY ANOTHER.` / `ACCESS DENIED.` / `TRY AGAIN.`

## Error Handling

- `validatePassword` never throws for a wrong password — a wrong password is an expected outcome, not an error, and returns a plain result the client uses for the branded microcopy state.
- `submitRequestAccess` calling an unconfigured Klaviyo client *does* throw (missing `KLAVIYO_PRIVATE_API_KEY`/`KLAVIYO_LIST_ID`, or a real Klaviyo API error) — this is a genuine failure the user should see something honest about, not a silent no-op. Since Server Actions' thrown errors surface through the nearest `error.tsx` boundary (already built, already tested, per the previous phase), no new fallback UI is built here — same reuse-what-exists reasoning as the Shopify client's error path.
- Following the just-learned lesson from the Shopify plan's final review: any new codegen-adjacent or generated artifacts this pass introduces (none are currently planned — Klaviyo's client is hand-written, not code-generated) would need the same "does this survive a fresh checkout" scrutiny. Called out here explicitly so it isn't missed if the approach changes during implementation.

## Testing

- **Unit (Vitest):** `validatePassword`'s three outcomes (general match, early-access match, no match) against fixture env vars; `subscribeToAccessList`'s not-configured throw and its request-shape construction against a mocked `fetch`, mirroring `lib/shopify/client.test.ts`'s pattern exactly.
- **E2E (Playwright):** the access page renders the entrance sequence and both forms; entering the general password grants access and redirects home; entering the early-access password also grants access (and sets the separate cookie, checked via the browser context, not just the redirect); entering a wrong password shows one of the five branded lines (not the generic browser-default and not silently doing nothing); `prefers-reduced-motion` is respected (mirroring the reduced-motion test pattern already established for the FullScreenMenu); a simulated crawler user-agent (e.g., `Googlebot/2.1`) reaches the homepage without any access cookie set, proving the SEO rule holds architecturally.

## New Architectural Decisions to Record

- **D-018**: Next.js Middleware → Proxy rename adopted (`proxy.ts`, Node.js runtime) — the current, non-deprecated convention, not the one most training data/tutorials still reference.
- **D-019**: `isbot` for crawler detection, over a hand-maintained user-agent list — SEO correctness depends on this staying current, which a maintained library does better than an ad hoc list would.
- **D-020**: Klaviyo integration via direct REST calls (`fetch`), not the official Node SDK — one simple endpoint call doesn't justify the heavier dependency, mirroring the same reasoning already applied to Shopify's lightweight client choice.

## Explicitly Open / Out of Scope for This Spec

- Esque Private, real early-access scheduling, model footage — see Non-Goals.
- Wiring the gate against real product/collection pages — Phase 4/5, not built yet.
- Klaviyo's actual account/list existing — like Shopify, this needs the project owner's own account setup; the code is built and tested against the "not configured" and fixture-mocked paths, not a live send.
