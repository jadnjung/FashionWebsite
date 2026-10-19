# Esque — Whole-Site Gate Removal + Drop-Specific Early-Access Gate

## Context

Three confirmed product decisions from the project owner (relayed via the top-level session, which asked clarifying questions and got explicit answers — this is not an inferred requirement):

1. **Remove the whole-site password gate entirely, starting now.** The site — including the already-live Collection 001 — becomes fully public immediately. No general "enter Esque" screen blocks ordinary browsing anymore.
2. **The new mechanic is drop-specific, not site-wide.** When a future drop (a new collection) is upcoming, non-code visitors see a **teaser only** — countdown to public launch, silhouette/blurred treatment, no real photos/prices/descriptions. A valid early-access code unlocks the real collection before public launch.
3. **Code delivery** reuses the existing Request Access flow (name/email → Klaviyo list) as-is. The project owner manually sends the drop-specific code to that list via Klaviyo when ready (PROJECT.md §16's own documented example: "Email members: Thursday 12:00 PM… Public release: Friday 12:00 PM").

This is a real reversal of part of what D-005/D-018/D-019 established (the whole-site gate's architecture), not a new feature bolted on top of it. PROJECT.md §91 already lists "upcoming-drop system" as its own distinct V1 line item, separate from "Esque Access Gate"/"Request Access"/"current universal password" — this spec resolves that line, not the whole-site-gate lines.

Per this project's established convention, PROJECT.md/DESIGN_SYSTEM.md/CONTENT.md are **not edited** — they remain the historical record of the original spec. ARCHITECTURE.md **is** edited (§3, §6, §7) because it is treated elsewhere in this codebase's own history as a living description of current structure, not a frozen original spec (see its own repeated "this was the plan, here's what shipped" notes). DECISIONS.md and ROADMAP.md are updated per their own explicit, established conventions.

## Goals

- Delete the whole-site gate: no redirect-to-`/access` for ordinary browsing, for anyone.
- Build a real, working collection-scoped early-access mechanic: teaser view (countdown + obscured content) for a locked, upcoming collection; code entry scoped to that one collection; a collection-scoped cookie; automatic flip to real content once the public `dropDate` passes, with no code needed.
- Reuse proven, tested UI/UX patterns (AccessForm's branded-microcopy/focus-management/`useActionState` shape, D-021's error-copy color rule, D-050's `aria-invalid`/`aria-describedby`, D-010's focus ring) rather than inventing a second system.
- Keep Request Access exactly as it is today (Klaviyo-wired, unchanged validation/copy/mechanism) — only its mounting location and surrounding chrome change.
- Update the Access Funnel analytics taxonomy deliberately: retire what no longer exists, add what the new flow actually produces.
- Extend Demo Mode with a genuinely-upcoming fixture collection so the project owner can preview the new flow locally.
- Rewrite the e2e suite to match the new reality rather than testing a mechanism that no longer exists.
- Record the reversal and the new mechanic's design in DECISIONS.md, explicit about which prior entries each new entry supersedes/amends.

## Explicit Non-Goals (deferred, or out of scope, with reasons)

- **Full PROJECT.md §35 "Collection Page" editorial experience** (hero, interactive model instance, unconventional grid) is not built. This spec builds the minimal real route needed to host the drop-gate mechanic and a plain, functional product grid for the unlocked state — "foundation only," exactly D-062's Archive precedent. A richer collection page is a future, separately-scoped feature.
- **A `/collections` index page** is not built. Only `/collections/[handle]` (dynamic detail). The primary-nav `COLLECTIONS` link in `lib/navigation-data.ts` already points at `/collections` and already 404s today (pre-existing, unrelated to this change, out of scope — not made worse, not fixed).
- **Supporting more than one simultaneously-upcoming drop.** PROJECT.md §7's own business model is strictly sequential (one collection at a time; the next drop only exists after the current one archives) — there is never more than one upcoming collection in practice. The design doesn't actively forbid a second one existing, but doesn't add complexity to optimize for it either.
- **A new signup mechanism.** Request Access (Klaviyo list + manual send) is reused exactly as it already works. No automated transactional "here's your code" email is built — same dependency gap D-020 already recorded (needs a real Klaviyo account/template).
- **Rate limiting / hashing the drop code server-side.** Per CONTENT.md §5 and D-005's own framing, this remains "a brand gate, not a security boundary" — unlimited attempts are allowed, exactly like the password gate it replaces. A security-engineer review (below) confirms this framing still holds and checks there's no *new* risk introduced by making the gate collection-scoped.
- **Permanent E2E coverage of the Shopify-dependent happy path** (real teaser render, real countdown, real code-entry → real content flip). This environment has no real Shopify store and Playwright's shared `webServer` can't selectively enable `PREVIEW_DEMO_MODE` for a subset of specs (D-058's own established, explicit precedent for this exact limitation). Covered instead by: unit tests for all pure logic, a temporary fixture-probe route for live verification during implementation (deleted before commit, per D-026/D-034/D-045/D-048/D-053/D-055/D-056/D-058/D-060's unbroken convention), and one E2E test confirming the new route exists and behaves like every other Shopify-dependent route in this unconfigured environment.

## Architecture

### 1. Whole-site gate removal

Delete `proxy.ts` entirely. Nothing else in this codebase uses Next.js Proxy/Middleware for anything else (confirmed: its only responsibilities were the gate redirect and the crawler bypass that served it). D-018 ("why Proxy") and D-019 ("why isbot") are both superseded — their premise (a sitewide redirect that needs a crawler exemption) no longer exists. The new drop-gate is a **route-level** check (inside `/collections/[handle]/page.tsx`, an RSC) because it is intrinsically data-dependent (needs the collection's own `dropDate`/`dropStatus`, which Proxy has no business fetching on every request) and intrinsically narrow (one route, not the whole site) — exactly the "a route-level check may now be more honest than a global Proxy matcher" reasoning the task anticipated.

**Crucially, the new gate does NOT reuse D-019's isbot-bypass pattern.** The whole-site gate's crawler bypass existed because D-005 required the *same real content* to reach crawlers and humans alike — bypassing was safe because there was nothing sensitive behind it. The drop-gate's entire purpose is the opposite: withholding real, unreleased product data from *everyone* — human or bot — until a code is entered or the public date passes. A crawler must see exactly the teaser a human without a code sees. Remove the `isbot` dependency from `package.json` (confirmed single consumer: `proxy.ts`; `next.config.ts`'s comments merely *reference* it, they don't import it).

**Consequence for `next.config.ts`:** D-057 Part 4 root-caused the Demo Mode `images.unoptimized` workaround to `proxy.ts` intercepting the image optimizer's internal loopback fetch. Once `proxy.ts` is gone, that interception can't happen. Verify this live (does a Demo-Mode local image optimize correctly now without the flag?) but **do not remove the `unoptimized` gate speculatively** — it costs nothing to leave (Demo Mode is an explicitly low-fidelity preview convenience, D-057), and removing it is only valuable if verified safe. Record the finding either way in DECISIONS.md as a noted-not-acted-on observation if not changed, matching D-052's "incidental finding" convention — do not silently leave it undiscovered.

### 2. Collection lifecycle classification — no new metafield

`ARCHITECTURE.md §5` already documents three metafields under the `custom` namespace: `drop_status`, `drop_date`, `archived_at`. `lib/shopify/collections.ts`'s `CollectionDetail`/`CollectionSummary` already fetch `dropStatus`/`dropDate`/`archivedAt`. `lib/archive/collections.ts`'s `isCollectionArchived` already derives "archived" from `dropStatus === 'archived'` (case-insensitive) OR `archivedAt !== null`.

**Do not add a new `dropStatus` value.** Derive "upcoming" purely from `dropDate` being in the future — the field already exists, already flows through both queries, and a second, redundant signal (`dropStatus === 'upcoming'`) would just be another string a merchandiser could forget to set correctly, duplicating information `dropDate` already carries unambiguously.

New module: **`lib/collections/drop-phase.ts`** (new small domain — shared by the new route and by the homepage's DropStatus addition, so it can't live route-colocated; mirrors `lib/archive/collections.ts`'s shape and is a sibling domain to it, not nested under it):

```ts
export type DropPhase = 'current' | 'upcoming' | 'archived';

// now is an injected parameter (defaults to new Date()) — mirrors this
// codebase's established injected-dependency-for-testability pattern
// (lib/motion/media.ts's injected matchMedia, lib/analytics/events.ts's
// injected sink) so "is this collection upcoming" is deterministically
// unit-testable against a fixed reference time, not real wall-clock time.
export function getDropPhase(
  collection: Pick<CollectionSummary, 'dropStatus' | 'archivedAt'> & { dropDate?: string | null },
  now: Date = new Date(),
): DropPhase {
  if (isCollectionArchived(collection)) return 'archived'; // imported from lib/archive/collections.ts, not reimplemented
  if (collection.dropDate && new Date(collection.dropDate) > now) return 'upcoming';
  return 'current';
}

export function isCollectionUpcoming(collection, now = new Date()): boolean {
  return getDropPhase(collection, now) === 'upcoming';
}
```

Note `CollectionSummary` does not currently carry `dropDate` (only `CollectionDetail` does) — `getUpcomingDrop()` below needs it on the summary shape returned by `getCollections()`. Extend `GET_COLLECTIONS_QUERY`/`CollectionSummary`/`getCollections()`'s mapping with `dropDate` the same low-risk way D-062 added `archivedAt` to `CollectionSummary` (zero existing consumers of the summary shape depend on its exact field set remaining unchanged — verify this is still true before extending). Regenerate codegen types (`pnpm graphql-codegen`) if the query document changes — it doesn't need to if `dropDate` is just added as another `metafield(...)` alias field, matching the existing `archivedAt` pattern exactly.

Precedence: archived wins over upcoming (an internally-contradictory data state — archived with a future dropDate — should never be treated as a live teaser).

### 3. The new route: `app/(storefront)/collections/[handle]/`

Lives under `(storefront)` (with Header/Footer/cursor/search), **not** as a shell-less experience like the old `/access`. Rationale: this is one collection's page within an otherwise fully public site, not a sitewide threshold — a visitor should never lose ordinary navigation because one specific collection happens to be in a locked state. This also matches `ARCHITECTURE.md §3`'s own original repo-structure sketch, which already placed `collections/[handle]/` under the storefront tree.

```
app/(storefront)/collections/[handle]/
├── page.tsx              — fetch, classify phase, branch
├── actions.ts            — validateDropAccessCode(handle, prevState, formData)
├── CollectionTeaser.tsx  — locked view: countdown + obscured placeholder + DropAccessForm + link to /access
├── DropAccessForm.tsx    — code-entry form, modeled on AccessForm.tsx's mechanics
├── DropCountdown.tsx     — SSR-safe countdown display
├── CollectionView.tsx    — unlocked/current view: real grid (reuses ProductGrid + getProductsByCollection)
```

Route-colocated (not under `components/`), matching this feature's own established precedent (`app/(access)/access/*.tsx` was always route-colocated, never under `components/`) — this is the same kind of self-contained, single-route feature.

`page.tsx` logic:

```ts
const collection = await getCachedCollection(handle); // cache()-wrapped, same pattern as PDP/Archive
if (!collection) notFound();
const phase = getDropPhase(collection);
if (phase === 'archived') notFound(); // this collection's real home is /archive/[handle]; do not render it twice under two URLs with different treatments

if (phase === 'upcoming') {
  const cookieStore = await cookies();
  const unlocked = hasUnlockedCollection(cookieStore.get(DROP_ACCESS_COOKIE_NAME)?.value, handle);
  if (!unlocked) {
    return <CollectionTeaser collection={collection} />; // no product fetch at all — never even calls getProductsByCollection
  }
}

// phase === 'current', or phase === 'upcoming' with a valid unlock cookie
const products = await getProductsByCollection(handle);
return <CollectionView collection={collection} products={products?.products ?? []} />;
```

Do **not** swallow a thrown Shopify error here — same reasoning as D-062 Part 2 (`getArchivedCollection`): the commerce data is this page's entire reason for existing, so a real failure correctly propagates to `app/error.tsx`.

No `export const dynamic = 'force-dynamic'` needed — a dynamic segment with no `generateStaticParams` is already per-request by default (D-062's own confirmed precedent for `/archive/[handle]`). Reading `cookies()` inside the `upcoming` branch doesn't change this (the route was never a static-generation candidate to begin with, unlike `/archive`'s bare index).

**`generateMetadata`** must branch on the same phase check (uses the *same* cached fetch — `cache()`-wrapped, one Shopify call total per request, matching the PDP/Archive pattern exactly):
- `archived` → irrelevant, `notFound()` already fires in the page body; `generateMetadata` should also call `notFound()` on the same condition (matches Archive's exact existing pattern in `[handle]/page.tsx`).
- `upcoming` + locked → **title/description must not leak real content.** Use a generic, teaser-safe title (e.g. `` `${collection.title} — Coming Soon — Esque` `` — the collection's own title, e.g. "Collection 002", is a bare sequence identifier, not a spoiler) and a generic description (e.g. `A new Esque collection is coming.`) — never `collection.description` (which may contain real campaign copy written for the eventual public launch).
- `upcoming` + unlocked, or `current` → real `collection.title`/`collection.description`, exactly like Archive's pattern.

Indexable in every phase (no `noindex`) — the teaser state is exactly the "honest partial content" this project already applies to draft legal pages (D-054 Part 5): real, genuine, present content for whoever's allowed to see it, never a technical wall against crawlers. `BreadcrumbList` JSON-LD (Home → Collection Title) in the unlocked/current branch only — the locked teaser has nothing structured worth marking up (no `Product` schema either way, matching `CategoryListing`/Archive's existing "listing page, not canonical single-product page" precedent).

### 4. The code-entry mechanism

**Where the code lives — judgment call, with reasoning (the task explicitly asked for this to be made and documented):**

Use a **new environment variable**, `ESQUE_DROP_ACCESS_CODE`, matching the existing `ESQUE_EARLY_ACCESS_PASSWORD` pattern — **not** a Shopify metafield, even though PROJECT.md §81 lists "Early-access password" among the CMS-controllable fields a non-technical owner should be able to edit, and even though `ARCHITECTURE.md §5` already prefers metafields for collection-specific editorial content.

Reason to reject the metafield: this codebase has exactly one Shopify API surface — the **Storefront API** (D-015), never the Admin API. A metafield readable via `collection.metafield(...)` through the Storefront API is, by Shopify's own access model, readable by *anyone* holding a valid Storefront API access token making their own direct GraphQL call to Shopify — not just by this app's own server. The Storefront API's access token is designed to be relatively public/embeddable (many headless storefronts expose it client-side); even though this codebase never exposes it to its own client bundle, the token's *permission model* assumes public-readable catalog data, not secrets. `dropDate`/`dropStatus` being technically world-readable this way is harmless (a date isn't sensitive); an unlock **code** being world-readable through the same surface would defeat the entire point of gating anything — it would be security theater, not a real second line of defense (which this feature doesn't strictly need per CONTENT.md §5, but there is no reason to choose the *more* leaky of two equally-simple options). An env var is read only by this app's own Node process; it is never exposed through any Shopify API at all.

This also resolves the "does it scale past one drop" question: per PROJECT.md §7's own strictly sequential drop model, there is never more than one upcoming collection at a time — one env var is not a scaling compromise, it's the correctly-sized solution for the real business model. The cookie (below) still scopes the *unlock* to a specific handle, so a correctness edge case (two collections simultaneously upcoming, an edge case the business model doesn't support) can't cross-unlock the wrong one even though the code itself is a single global secret.

**Server action** (`app/(storefront)/collections/[handle]/actions.ts`):

```ts
export interface ValidateDropAccessResult { success: false }

export async function validateDropAccessCode(
  handle: string, // bound via .bind(null, handle) at the call site, or passed through a hidden form field — see Implementation Notes
  _prevState: ValidateDropAccessResult,
  formData: FormData,
): Promise<ValidateDropAccessResult> {
  const code = String(formData.get('code') ?? '');
  const configuredCode = process.env.ESQUE_DROP_ACCESS_CODE;
  const cookieStore = await cookies();

  if (configuredCode && code === configuredCode) {
    const existing = cookieStore.get(DROP_ACCESS_COOKIE_NAME)?.value;
    cookieStore.set(DROP_ACCESS_COOKIE_NAME, addUnlockedHandle(existing, handle), dropAccessCookieOptions);
    cookieStore.set(DROP_ACCESS_EVENT_COOKIE_NAME, handle, dropAccessEventCookieOptions);
    redirect(`/collections/${handle}`); // re-navigates to the same URL; the fresh server render now reads the cookie and shows CollectionView
  }

  return { success: false };
}
```

Plain string equality, unlimited attempts — matches `validatePassword`'s own documented stance exactly (D-005/CONTENT.md §5: a brand gate, not a security boundary). The `handle`-binding mechanism matters: `useActionState` requires a 2-arg action signature `(prevState, formData)`, but this action also needs to know *which* collection's code to check against. Follow the same pattern React/Next.js document for a bound server action: `const boundAction = validateDropAccessCode.bind(null, handle);` passed to `useActionState(boundAction, initialState)` inside `DropAccessForm`, which itself receives `handle` as a prop from `page.tsx` → `CollectionTeaser` → `DropAccessForm`. Verify this binding pattern live (bound server actions are a real, documented Next.js/React mechanism, but confirm it typechecks and works end-to-end via the fixture-probe verification below, not just assumed).

**Cookie shape** (`lib/access/cookies.ts`, extended — this file's *responsibility* is unchanged, "access gate cookie logic," only its concrete shape evolves to match the collection-scoped reality):

Remove (nothing produces these anymore once `validatePassword`/the whole-site gate is deleted): `ACCESS_COOKIE_NAME`, `VIP_ACCESS_COOKIE_NAME`, `ACCESS_COOKIE_MAX_AGE_SECONDS`, `AccessEventTier`, `ACCESS_EVENT_COOKIE_NAME`, `ACCESS_EVENT_COOKIE_MAX_AGE_SECONDS`, `parseAccessEventCookie`.

Add:
```ts
export const DROP_ACCESS_COOKIE_NAME = 'esque_drop_access';
export const DROP_ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days — generous; harmless once the collection is no longer 'upcoming', since the route-level check only ever consults this cookie in that one phase

// Value is a comma-separated list of unlocked collection handles (not a
// boolean) — scopes an unlock to the specific drop it was granted for, so
// a stale cookie from a past drop can never unlock a future, differently-
// coded one. Shopify handles are URL-safe slugs (no commas), so a plain
// split is safe with no escaping needed.
export function hasUnlockedCollection(cookieValue: string | undefined, handle: string): boolean {
  if (!cookieValue) return false;
  return cookieValue.split(',').includes(handle);
}

export function addUnlockedHandle(cookieValue: string | undefined, handle: string): string {
  const existing = cookieValue ? cookieValue.split(',') : [];
  return existing.includes(handle) ? existing.join(',') : [...existing, handle].join(',');
}

export const DROP_ACCESS_EVENT_COOKIE_NAME = 'esque_drop_access_event';
export const DROP_ACCESS_EVENT_COOKIE_MAX_AGE_SECONDS = 60;

// Mirrors parseAccessEventCookie's exact shape (D-055) but the value is an
// arbitrary collection handle, not a closed tier enum.
export function parseDropAccessEventCookie(cookieString: string): string | null {
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${DROP_ACCESS_EVENT_COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
```

Cookie flags: `httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/'` for `DROP_ACCESS_COOKIE_NAME` (same WebKit-localhost reasoning as the old `cookieOptions` — keep the `NODE_ENV` gate, don't hardcode `secure: true`). `DROP_ACCESS_EVENT_COOKIE_NAME` stays `httpOnly: false` (ShellClient must read it client-side) with the same short `Max-Age=60` safety-net reasoning as before.

Old cookies (`esque_access`/`esque_vip_access`) that may already exist in a returning visitor's browser from before this change become permanently inert the moment nothing reads them — no explicit cleanup needed (they expire naturally within their existing ~30-day window). Note this as a deliberate choice, not an oversight.

**`ShellClient.tsx`**: replace the `access_granted`/tier-cookie effect with the drop-scoped equivalent — same read-fire-clear shape, firing `drop_access_granted` with `{ collection_handle: handle }` instead of `{ tier }`.

### 5. UI components — reused patterns, not a second system

**`DropAccessForm.tsx`**: closely modeled on `AccessForm.tsx`'s mechanics — `useActionState` + uncontrolled `<input name="code">` (D-022's exact fix: never a controlled input for this), the *same* `INCORRECT_PASSWORD_MESSAGES` rotation (move this array + `pickNextMessage` out of the soon-deleted `AccessForm.tsx` into this new file — CONTENT.md §5 explicitly permits reusing it for "incorrect code," not just "incorrect password," and the task instruction is explicit: reuse, don't invent new ones), the same `--color-esque-text`-not-`--color-esque-error` copy color (D-021), the same `aria-invalid`/`aria-describedby` wiring (D-050), the same focus-management-after-failure pattern (re-keyed wrapper div to restart the shift animation and restore focus). Field label: `EARLY ACCESS CODE` (not `PASSWORD` — distinct, honest naming for a different, narrower mechanism). Button label: `ENTER` (CONTENT.md §10's established CTA vocabulary already includes this verb in this exact context).

Fires `drop_access_attempt` (`{ collection_handle: handle }`) from the form's own `onSubmit`, mirroring `request_access_attempt`'s exact "fires on every submission regardless of outcome, from a real DOM event, doesn't `preventDefault`" shape (D-055 Part 5).

A "Don't have a code? Request Access." link to `/access` sits below the form — **not** an inline `RequestAccessForm` (see §6 below for why).

**`DropCountdown.tsx`**: a client component. **SSR-safety is load-bearing here** — this codebase has already been bitten twice by exactly this class of hydration mismatch (D-047, D-051 Finding 1), both involving a value that differs between server-render-time and the client's first-hydration-pass. A countdown is structurally the same risk: `Date.now()` necessarily differs between when the server rendered and when the client hydrates.

Correct pattern: the server-rendered parent (`page.tsx`/`CollectionTeaser.tsx`, an RSC) computes `targetTimestamp` (epoch ms from `collection.dropDate`) and passes it as a plain number prop. `DropCountdown`'s **first render — server and client alike — must never call `Date.now()` or any clock read during render or in a `useState` initializer.** Render a static, deterministic value on first paint (e.g. just the formatted target date: "LAUNCHES OCT 24, 2026") computed purely from the prop, with no live numbers yet. Only inside a `useEffect` (which by definition runs strictly after hydration, never during it) start a `setInterval` that reads `Date.now()` and begins showing live remaining-time numbers, updating local state thereafter. This guarantees the first client render is byte-identical to the server's, and ticking only ever begins after that first paint is already committed — no mismatch possible, mirroring D-047's `useSyncExternalStore`-with-a-safe-`getServerSnapshot` discipline even though a plain `useEffect`+`setInterval` is a proportionate implementation here (not every ticking value needs the full `useSyncExternalStore` ceremony — this one has no cross-tab/external-store concern, just a hydration-timing one). Respect `prefers-reduced-motion`: a ticking per-second display doesn't itself need suppressing under reduced motion (it's plain text content update, not a transform/animation per DESIGN_SYSTEM §63's "retain: fades, state changes" carve-out), but do not add any transition/animation *around* the number changing.

**`CollectionTeaser.tsx`**: composes `DropCountdown` + an obscured image treatment + `DropAccessForm` + the Request Access link. For the obscured imagery: there is no real upcoming-drop photography in this environment (same honest-foundation state as Archive's "zero archived collections today"). Use PROJECT.md §42's own vocabulary directly — a clearly-labeled placeholder block (DESIGN_SYSTEM §65's established `ESQUE PLACEHOLDER` convention, styled via `text-esque-text-secondary` per D-048, not `-text-muted`) with a `blur`/reduced-opacity CSS treatment applied on top of it, demonstrating the *mechanism* (a real `filter: blur(...)` or heavy-opacity-reduction class that genuinely would obscure real photography once it exists) even though there's nothing real to blur yet — exactly D-032/D-034's established "build the real mechanism now, against honest placeholder content" discipline. Do **not** fetch or render `collection.description`, product data, or anything beyond the collection's bare title/handle/dropDate while locked.

**`CollectionView.tsx`**: the unlocked/current state. Reuses `ProductGrid`/`ProductCard` directly (real `<Link>`s to real `/products/[handle]` PDPs — unlike `ArchivedProductTile`, these are live, purchasable products, so the ordinary interactive `ProductCard` is the correct component, not a new inert variant). Structurally similar to `ArchivedCollectionView.tsx` (heading, optional description, grid, empty state) but products are fully interactive.

### 6. `/access` — repurposed, not deleted; moved under `(storefront)`

Delete: `AccessForm.tsx`, `EntranceMotion.tsx`, `validatePassword` (from `actions.ts`), and the `(access)` route group entirely once empty.

Keep, moved to `app/(storefront)/access/`: `RequestAccessForm.tsx` and `submitRequestAccess` (from `actions.ts`) — **unchanged copy, unchanged validation, unchanged Klaviyo wiring**, per the task's explicit "as-is" instruction. Two narrow, mechanically-necessary adaptations (not a copy/behavior rewrite):

1. `onBack` prop removed entirely (and the rendered "Back" button with it) — there is no sibling password screen to return to anymore, and `/access` now lives inside the storefront shell, so Header's own navigation already provides a way elsewhere.
2. A mount-time `useEffect` firing `request_access_open` is added directly to `RequestAccessForm` (previously fired from `AccessForm`'s now-deleted toggle button) — necessary because visiting `/access` *is* opening the request-access flow now, with no separate "open" gesture to attach the event to. `request_access_attempt`'s existing `onSubmit` firing is untouched.

**Why `/access` is moved, not folded into the collection teaser:** `RequestAccessForm` has zero Shopify dependency today, which is exactly why its four existing E2E tests are reliable in this Shopify-unconfigured CI environment. `/collections/[handle]` is *necessarily* Shopify-dependent (it must know if the collection exists/is upcoming). Mounting `RequestAccessForm` only inside the teaser would make it completely unreachable through normal navigation in CI (the teaser can never render past the generic error boundary without a real store or Demo Mode) — a real, avoidable regression in both testability and real-world resilience (if Shopify is ever briefly misconfigured, Request Access should still work). Keeping `/access` standalone preserves its existing independence; the teaser simply **links** to it.

`/access`'s own metadata: now indexable (`buildPageMetadata`, no `noindex`) — it's genuine, evergreen, useful content ("join the list for early access to future drops") with no gate purpose left to hide. New page content: the `ESQUE` heading (brand mark, unchanged, safe reuse) directly above `<RequestAccessForm />`. No new marketing copy is invented beyond what's structurally necessary — if a short supporting line is wanted, draw only from vocabulary PROJECT.md/CONTENT.md already establish (e.g., paraphrasing PROJECT.md §16's own "email subscribers receive a drop-specific password… before general release" framing), not freestanding invented copy.

### 7. Homepage — `DropStatus.tsx` (Scene 06)

Currently 100% static, zero Shopify dependency (D-032). Add exactly one new, isolated Shopify read, mirroring `lib/home/selected-pieces.ts`'s established shape precisely (D-033's swallow-to-safe-fallback exception): a new `lib/home/upcoming-drop.ts`:

```ts
export async function getUpcomingDrop(): Promise<{ handle: string; title: string; dropDate: string } | null> {
  try {
    const { collections } = await getCollections();
    const upcoming = collections.find((c) => isCollectionUpcoming(c));
    if (!upcoming?.dropDate) return null;
    return { handle: upcoming.handle, title: upcoming.title, dropDate: upcoming.dropDate };
  } catch (error) {
    console.error(error); // stays operationally visible, D-033's exact precedent
    return null;
  }
}
```

`DropStatus` becomes an `async` Server Component, calling this once. When it resolves non-null, render a **second** line below the existing Collection 001 copy (which stays exactly as-is — do not remove or alter the current, real, verbatim DESIGN_SYSTEM §35/CONTENT.md §8 copy block) linking to `/collections/${handle}` — e.g. the collection's title plus a date-derived label, using the CTA vocabulary already established (`EXPLORE COLLECTION →`-style text link, not a new button variant). When it resolves `null` (today's honest, default state — no upcoming collection exists in this environment), render nothing extra — identical to today's output.

**Do not read cookies here.** The homepage link always shows "coming [date]" regardless of the visitor's own unlock status — personalization happens on the destination page, not the homepage. This is a deliberate simplification that keeps `/` static (D-033/D-044–046/D-055 Part 5a all specifically protect this; reading cookies in an RSC forces dynamic rendering, per D-055 Part 5a's own explicit reasoning, and must not regress here). Confirm via `pnpm build`'s route table that `/` is still `○ (Static)` after this change — this is a direct, checkable regression risk, not a theoretical one.

## Navigation / discoverability

- `/collections/[handle]` is discoverable via: a direct link once DropStatus surfaces it (homepage), and via the Klaviyo email itself once the project owner sends one (the email would literally link to this URL).
- `/access` is discoverable via: the teaser's "Request Access" link, and could in principle gain a Footer link later — **not added this pass** (not requested, and `/access`'s discoverability without an active drop is a smaller concern than this task's actual scope; flagged, not built, matching this project's own "don't manufacture unrequested scope" discipline).
- The pre-existing `COLLECTIONS` primary-nav link (`lib/navigation-data.ts`) continues to point at the still-unbuilt `/collections` index and continues to 404 — unrelated, pre-existing, correctly out of scope.

## SEO

- `app/sitemap.ts`: do **not** add per-handle `/collections/[handle]` entries — enumerating real handles needs a real store, the identical, already-established limitation `/products/[handle]`/`/archive/[handle]` entries already carry (D-053/D-062). The *page* stays indexable regardless (discoverable via normal crawling once linked from the homepage), matching the PDP's own precedent exactly.
- `app/robots.ts`: no change needed. It already allows everything; nothing about this feature needs a new disallow rule (per the same noindex-vs-disallow reasoning D-053 already established for `/access`, which no longer even needs `noindex` now — see §6).
- `/access`'s `noindex` is removed (§6) — this is itself a small, positive instance of "D-005's goal gets easier to satisfy, not harder," since one previously-excluded real page becomes includable.

## Demo Mode

Add one new fixture collection to `lib/shopify/preview-demo-fixtures.ts`'s `PREVIEW_COLLECTIONS`/`getPreviewCollectionDetail`: `collection-002`, a genuinely future `dropDate` relative to this session's "today" (2026-10-18) — e.g. `2026-11-20T12:00:00Z` — with no products needed for the locked teaser path (the teaser never fetches products) but worth adding 1–2 fixture products anyway so the *unlocked* path is also previewable end-to-end once a demo code is entered. The code-check itself needs no Demo Mode branch at all — `validateDropAccessCode` reads `process.env.ESQUE_DROP_ACCESS_CODE` directly, which works identically whether `PREVIEW_DEMO_MODE` is set or not (the env var comparison never touches Shopify). Document this plainly in the final report: set `PREVIEW_DEMO_MODE=1` and `ESQUE_DROP_ACCESS_CODE=<anything>` in `.env.local`, visit `/collections/collection-002` to see the teaser/countdown, enter that code to see it unlock.

## Analytics — Access Funnel taxonomy

Remove from `lib/analytics/events.ts` (nothing will ever produce these again): `access_gate_view`, `access_granted` (and its `tier: 'general' | 'vip'` property shape).

Keep unchanged: `request_access_open`, `request_access_attempt` (`NoProperties` both; same call sites conceptually, new mount locations per §6).

Add:
```ts
drop_teaser_view: { collection_handle: string };   // fires once per mount of CollectionTeaser (locked state only) — analogous to the old access_gate_view's funnel-entry role
drop_access_attempt: { collection_handle: string }; // fires on every code submission, success or failure — mirrors request_access_attempt's shape; never include the submitted code itself
drop_access_granted: { collection_handle: string }; // fires once, post-redirect, via the ShellClient signal-cookie mechanism — analogous to the old access_granted
```

Add `'code'` to `sanitizeEventProperties`'s `PII_KEY_DENYLIST` in the same file — defense-in-depth even though no declared property shape above has a `code` field (mirrors the existing denylist's own "defends a risk the type system already closes off one level down" framing).

## Testing

**Unit tests** (new/updated):
- `lib/collections/drop-phase.test.ts` — `getDropPhase`/`isCollectionUpcoming` against fixed `now` values: before/at/after the boundary, archived-wins-over-upcoming, null `dropDate`.
- `lib/access/cookies.test.ts` — extend for `hasUnlockedCollection`/`addUnlockedHandle` (absent, present, appending a second handle, not duplicating an already-present one) and `parseDropAccessEventCookie`; remove assertions for the deleted `parseAccessEventCookie`.
- `app/(storefront)/collections/[handle]/actions.test.ts` — mirrors the deleted `validatePassword` tests' exact mocking shape (`vi.mock('next/headers')`/`vi.mock('next/navigation')`) for `validateDropAccessCode`: matching code sets the cookie (with the handle appended, not replacing a prior handle) and redirects; non-matching code returns `{ success: false }` and sets nothing; env var unset never matches an empty/any submission; a second successful unlock for a *different* handle appends rather than overwrites.
- `app/(storefront)/access/actions.test.ts` (moved from the deleted file, `submitRequestAccess` tests carried over verbatim — behavior is unchanged).
- A small test for the relocated `pickNextMessage`/`INCORRECT_PASSWORD_MESSAGES` (wherever they land — `DropAccessForm.tsx` or a tiny extracted module), porting the deleted `AccessForm.test.ts`'s coverage.
- `lib/home/upcoming-drop.test.ts` — `getUpcomingDrop()` against a mocked `getCollections` (resolves to the upcoming one; resolves `null` when none/all current/all archived; swallows a thrown error to `null` with a `console.error`, mirroring `selected-pieces.test.ts`'s existing pattern).

**E2E** (`tests/e2e/access-gate.spec.ts`, substantially rewritten; `tests/e2e/smoke.spec.ts`'s `beforeEach`):

- `smoke.spec.ts`: delete the `beforeEach` that sets `esque_access`. Run the full file afterward — every test must still pass with no cookie at all, which is itself the verification that the gate is actually gone.
- `access-gate.spec.ts`: **remove** the entire "password entry" describe block (9 tests — the mechanism no longer exists), the entire "entrance motion" describe block (5 tests — `EntranceMotion` is deleted), and the entire "proxy enforcement" describe block (7 tests — `proxy.ts` is deleted; nothing redirects anything anymore, so these assertions have no subject). **Rewrite** the "request access" describe block (4 tests) to navigate directly to `/access` (no more "click REQUEST ACCESS first" step — remove that from each test) and otherwise keep the same assertions (fields visible, server-side consent validation, field-level `aria-invalid` association, Klaviyo-not-configured surfaces the error boundary). **Add**: a test that `/collections/any-handle` in this Shopify-unconfigured environment hits the same generic error boundary every other catalog/PDP/archive route already does (mirrors `catalog.spec.ts`'s established pattern) — the one new-route assertion that *is* honestly E2E-testable here without a real store or Demo Mode.

**Live verification during implementation** (temporary, deleted before commit, matching the established convention exactly): a fixture-backed probe route confirming, with `PREVIEW_DEMO_MODE=1` and a real dev server: the locked teaser renders with no product data fetched, the countdown shows a sane value with no hydration-mismatch console warning, submitting the wrong code shows a rotating branded message and does not unlock, submitting the right code (`ESQUE_DROP_ACCESS_CODE` set in the test env) sets the cookie and the *same URL* re-renders as `CollectionView`, a second visit with the cookie already set skips straight to `CollectionView`, and the homepage's `DropStatus` addition links to the right handle. Also confirm `pnpm build`'s route table still shows `/` as `○ (Static)`.

## New Architectural Decisions to Record

Record as separate DECISIONS.md entries (continuing after D-062), not one giant entry — the gate removal and the new mechanic's design are genuinely distinct decisions:

1. **Whole-site gate removal.** Supersedes D-018 (Proxy for gate enforcement — the gate Proxy existed to enforce is gone) and D-019 (isbot bypass — nothing left to bypass). Amends D-005 (the goal "UI-layer, not an SEO wall" is now satisfied more simply — there's no wall at all for ordinary routes). Notes D-054's "Noted, not addressed this pass" concern (Request Access collecting email before a cookie-free path to `/legal/privacy` existed) as now resolved, since every route is unconditionally public.
2. **The new collection-scoped drop-gate mechanic.** Amends ARCHITECTURE.md §6's original "Drop-specific/VIP access stored as a separate cookie/claim" anticipation (now built, differently-shaped than originally sketched — a handle-list, not a VIP boolean). Records: the no-new-metafield `dropDate`-only phase derivation; the env-var-not-metafield code-storage decision and its Storefront-API-exposure reasoning; the handle-scoped (not boolean) cookie shape; the route-level-not-Proxy enforcement choice and why D-019's bypass pattern deliberately does not carry over.
3. **Analytics taxonomy changes** (retiring `access_gate_view`/`access_granted`, adding the three `drop_*` events) — can be folded into entry 2 if the combined entry stays readable, or its own short entry if not; judgment call at write-time based on actual length.
4. Any genuine defect found during integration review, per this project's own established convention of recording findings-and-fixes, not just the final shape.

## Explicitly Open / Out of Scope for This Spec

- A richer `/collections/[handle]` editorial experience (hero, interactive model) — future work, not this pass.
- A Footer link for `/access` — not requested, flagged only.
- Rate limiting / audit logging of code attempts — explicitly not needed per this gate's own documented "brand gate, not security boundary" nature; revisit only if that framing itself is ever reconsidered.
- Whether `next.config.ts`'s Demo Mode `unoptimized` flag is still necessary post-`proxy.ts`-removal — verify live, record the finding, act only if clearly safe and low-risk.
