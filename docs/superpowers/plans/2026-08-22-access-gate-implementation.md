# Access Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ROADMAP.md Phase 6 (Access Gate) in full: a Proxy-enforced password gate with two access tiers (general/VIP), a Request Access → Klaviyo flow, and the full entrance motion sequence with placeholder SVG silhouettes — while keeping crawlers and every existing route fully reachable.

**Architecture:** A new `app/(access)/access/` route (Server Component page + two Client Component forms + Server Actions) sits outside the main shell, which itself moves into a new `app/(storefront)/` route group so `(access)` can render without Header/FullScreenMenu/Footer. A root-level `proxy.ts` redirects ungated human visitors to `/access` and lets crawlers (via `isbot`) through unconditionally. `lib/klaviyo/` mirrors `lib/shopify/client.ts`'s lazy-throw pattern for a direct REST call to Klaviyo's Subscribe Profiles endpoint. `lib/access/cookies.ts` is the single source of truth for cookie names shared between the Server Action that sets them and the proxy that checks them.

**Tech Stack:** Next.js 16.3.1 Proxy (`proxy.ts`, Node.js runtime), React 19.2.8 Server Actions (`useActionState`, async `cookies()`/`redirect()`), `isbot` (new dependency, crawler detection), `motion` (new dependency, already pre-approved in ARCHITECTURE.md — cursor-reactive parallax + entrance fade), Klaviyo REST API via `fetch` (no new dependency), Vitest (unit tests for all server-side logic), Playwright (E2E for all UI behavior — this project has no component-testing setup; `vitest.config.ts` runs in a Node environment with no DOM, so UI behavior is verified via Playwright exactly as FullScreenMenu was).

**Spec:** [docs/superpowers/specs/2026-08-22-access-gate-design.md](../specs/2026-08-22-access-gate-design.md)

## Global Constraints

- Proxy convention: `proxy.ts` at the repo root, named `export function proxy(request: NextRequest)`, Node.js runtime — never the deprecated `middleware.ts`/`export function middleware()`.
- Crawlers (detected via `isbot`) bypass the gate unconditionally, regardless of cookie state — this is what satisfies DECISIONS.md D-005.
- Password comparison is plain string equality. No hashing, no rate-limiting, no lockout — this is a brand gate, not a security boundary (CONTENT.md §5, DECISIONS.md D-005).
- Access cookies (`esque_access`, `esque_vip_access`): `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `path: '/'`, `maxAge: 2592000` (~30 days per ARCHITECTURE.md §6 / DESIGN_SYSTEM.md §57).
- All customer-facing copy is verbatim from CONTENT.md §3–5 — never paraphrased.
- `prefers-reduced-motion` must disable the entrance sequence and cursor-parallax (via `motion/react`'s `useReducedMotion` — its JS-driven `style` mutations bypass CSS `transition`/`animation` properties entirely, so the existing global CSS reduced-motion rule in `app/globals.css` does not cover them). Plain CSS `@keyframes` animations (the incorrect-password shift/message effects) are already covered by that existing global rule — no new reduced-motion code needed for those.
- Klaviyo integration is direct `fetch` REST calls, not the official Node SDK (DECISIONS.md D-020).
- Out of scope this pass (spec's Non-Goals): Esque Private tier, real time-boxed early-access scheduling, model footage, rate-limiting/hashing, the transactional "here's your password" email (Klaviyo account/template doesn't exist yet — mirrors D-016's Shopify-store dependency reasoning).

---

## Task 1: Restructure the shell into a `(storefront)` route group

The access gate must render without Header/FullScreenMenu/Footer (ARCHITECTURE.md §6). Currently `app/layout.tsx` renders `<ShellClient>{children}</ShellClient>` unconditionally for every route — there is no route-group separation yet, because only one route (`/`) has ever existed. Next.js layouts are additive (a child segment can't opt out of a parent's layout), so the shell must move down into its own route group before `(access)` can exist alongside it. `/` itself must render identically afterward.

One real consequence this task must also handle: `app/not-found.tsx`, `app/loading.tsx`, and `app/error.tsx` are root-level special files, currently wrapped by the shell (via root layout). `error.tsx` must stay at root regardless — it's the only shared ancestor of both `(storefront)` and `(access)`, and Task 5's E2E test relies on an `(access)`-route error reaching it, so losing the shell there is correct, not a bug (an `/access` error shouldn't show Header/Footer either). `not-found.tsx` also can't move into `(storefront)` — Next.js's synthetic global-404 route (what actually renders for an unmatched URL like a not-yet-built nav link) only ever consults the root-level file, never a route-group-specific one (verified against current Next.js internals docs) — but its own existing comment documents relying on the shell's Header/Footer for a way back out, which this restructuring removes. That gets a small, explicit fix in Step 5 below. `loading.tsx` needs no fix: it's a transient, self-resolving state with no dead end to escape from.

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/(storefront)/layout.tsx`
- Create: `app/(storefront)/page.tsx` (moved from `app/page.tsx`)
- Delete: `app/page.tsx`
- Modify: `app/not-found.tsx`
- Modify: `tests/e2e/smoke.spec.ts` (regression coverage for the fix above)

**Interfaces:**
- Produces: the shell (`ShellClient`) now lives at `app/(storefront)/layout.tsx`, applying only to routes under `(storefront)` — later tasks' `(access)` routes never receive it.

- [ ] **Step 1: Confirm the existing E2E baseline passes before touching anything**

Run: `pnpm test:e2e`
Expected: all existing tests in `tests/e2e/smoke.spec.ts` pass (this is the safety net proving the move below is behavior-preserving).

- [ ] **Step 2: Create the `(storefront)` layout, moving `ShellClient` into it**

Create `app/(storefront)/layout.tsx`:

```tsx
import { ShellClient } from '@/components/navigation/ShellClient';

// The shell (Header/FullScreenMenu/Footer) lives here, not in the root
// layout — app/(access) needs to render without it (ARCHITECTURE.md §6),
// and Next.js layouts are additive (a child segment can't opt out of a
// parent's layout), so the shell must sit in its own route group rather
// than the root.
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <ShellClient>{children}</ShellClient>;
}
```

- [ ] **Step 3: Move the homepage into the new group**

Create `app/(storefront)/page.tsx` with exactly the current contents of `app/page.tsx`:

```tsx
export default function Home() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-display-xl tracking-display text-esque-text">ESQUE</h1>
      <p className="text-body text-esque-text-secondary">COLLECTION 001 — IN DEVELOPMENT</p>
    </div>
  );
}
```

Delete `app/page.tsx` (its content now lives at `app/(storefront)/page.tsx`; `(storefront)` is a route group and adds no URL segment, so this still serves `/`).

- [ ] **Step 4: Simplify the root layout to stop rendering the shell directly**

Modify `app/layout.tsx` — replace the body:

```tsx
import type { Metadata } from 'next';
import { functionalFont, displayFont } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Esque',
  description: 'Esque — a niche, experimental fashion house.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${functionalFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      {/* Functional Swiss sans is the site's base/default typeface — DESIGN_SYSTEM.md
          §6 lists it for nav, controls, product info, forms, and utility text, i.e.
          most of the page. Display (§7) is expressive/editorial and opt-in per
          element via the font-display utility, not a body-wide default. */}
      <body className="min-h-full flex flex-col font-functional">{children}</body>
    </html>
  );
}
```

Only the `<ShellClient>` wrapper is removed; `import { ShellClient } ...` is deleted along with it (now unused here — it moved to Step 2's file).

- [ ] **Step 5: Give the now-shell-less not-found page an explicit way back**

Modify `app/not-found.tsx`:

```tsx
import Link from 'next/link';

// CONTENT.md §6 — 404 copy is `THIS PIECE DOESN'T EXIST.`. Every category
// link (Header, FullScreenMenu) and footer link points to a route that
// doesn't exist yet in this shell-only pass, so this page is reachable from
// normal navigation, not just direct URL entry.
//
// A truly-unmatched URL renders via Next.js's synthetic global not-found
// route, which only ever consults the ROOT app/not-found.tsx (verified
// against current Next.js internals — route-group-specific not-found files
// are never used for this case). Since the shell (Header/Footer/
// FullScreenMenu) now lives in app/(storefront)/layout.tsx rather than the
// root layout (moved there so app/(access) can render without it — see this
// task's own description), this page no longer has Header/Footer to
// navigate back out through. The link below replaces that escape hatch,
// reusing the same "ESQUE" wordmark-as-home-link pattern Header already
// uses, rather than inventing new copy.
//
// Follows the same visual pattern as app/loading.tsx and app/error.tsx
// (dark background inherited from body, font-display, text-esque-text/
// text-display-l). Unlike error.tsx, not-found.tsx has no reset/error-
// boundary semantics, so it stays a Server Component — no client
// interactivity needed.
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-display-l tracking-display text-esque-text">
        THIS PIECE DOESN&apos;T EXIST.
      </h1>
      <Link
        href="/"
        className="text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
      >
        ESQUE
      </Link>
    </div>
  );
}
```

- [ ] **Step 6: Add regression coverage and verify the move is behavior-preserving**

Modify `tests/e2e/smoke.spec.ts` — add a new `test.describe` block (the existing blocks are unchanged):

```typescript
test.describe('not-found', () => {
  test('visiting a nonexistent route shows the branded 404 with a way back to Esque', async ({
    page,
  }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ESQUE' })).toBeVisible();
  });
});
```

Run: `pnpm typecheck && pnpm build && pnpm test:e2e`
Expected: typecheck and build succeed; every pre-existing test in `tests/e2e/smoke.spec.ts` still passes unchanged (`/` renders identically — Header, FullScreenMenu, Footer, homepage content, focus/skip-link behavior, reduced-motion handling — because `(storefront)` adds no URL segment and `ShellClient`'s own code is untouched), plus the new not-found test above passes.

- [ ] **Step 7: Commit**

```bash
git add app/layout.tsx app/page.tsx "app/(storefront)" app/not-found.tsx tests/e2e/smoke.spec.ts
git commit -m "refactor: move shell into (storefront) route group

Prepares for the access gate: app/(access) routes (Task 4+) must render
without Header/FullScreenMenu/Footer per ARCHITECTURE.md §6, and Next.js
layouts are additive, so the shell moves out of the root layout into its
own route group. / renders identically; app/not-found.tsx (which can't
move — Next.js's global-404 route only ever uses the root-level file)
gets an explicit link back to / to replace the Header/Footer escape hatch
it lost."
```

---

## Task 2: Klaviyo client and subscribe function

Mirrors `lib/shopify/client.ts`'s lazy-throw pattern exactly: nothing throws until a function is actually called, so importing this module never fails just because Klaviyo isn't configured yet. No new dependency — a direct `fetch` call (DECISIONS.md D-020).

**Files:**
- Create: `lib/klaviyo/client.ts`
- Test: `lib/klaviyo/client.test.ts`
- Create: `lib/klaviyo/subscribe.ts`
- Test: `lib/klaviyo/subscribe.test.ts`

**Interfaces:**
- Produces: `klaviyoRequest(path: string, body: unknown): Promise<void>`, `getKlaviyoListId(): string` (both from `lib/klaviyo/client.ts`), `subscribeToAccessList(email: string): Promise<void>` (from `lib/klaviyo/subscribe.ts`) — Task 5's `submitRequestAccess` Server Action calls `subscribeToAccessList`.

- [ ] **Step 1: Write the failing tests for the client**

Create `lib/klaviyo/client.test.ts`:

```typescript
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { klaviyoRequest, getKlaviyoListId } from '@/lib/klaviyo/client';

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('klaviyoRequest', () => {
  test('throws a clear error when KLAVIYO_PRIVATE_API_KEY is unset', async () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', undefined);
    vi.stubEnv('KLAVIYO_LIST_ID', 'test-list-id');
    await expect(klaviyoRequest('/test/', {})).rejects.toThrow(
      'Klaviyo is not configured. Set KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID.',
    );
  });

  test('throws a clear error when KLAVIYO_LIST_ID is unset', async () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', 'test-key');
    vi.stubEnv('KLAVIYO_LIST_ID', undefined);
    await expect(klaviyoRequest('/test/', {})).rejects.toThrow(
      'Klaviyo is not configured. Set KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID.',
    );
  });

  test('sends an authenticated POST request and resolves on a successful response', async () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', 'test-key');
    vi.stubEnv('KLAVIYO_LIST_ID', 'test-list-id');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202, statusText: 'Accepted' });
    vi.stubGlobal('fetch', fetchMock);

    await klaviyoRequest('/profile-subscription-bulk-create-jobs/', { hello: 'world' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Klaviyo-API-Key test-key' }),
        body: JSON.stringify({ hello: 'world' }),
      }),
    );
  });

  test('throws with the response status when Klaviyo returns a non-ok response', async () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', 'test-key');
    vi.stubEnv('KLAVIYO_LIST_ID', 'test-list-id');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' }),
    );

    await expect(klaviyoRequest('/test/', {})).rejects.toThrow(
      'Klaviyo request failed: 401 Unauthorized',
    );
  });
});

describe('getKlaviyoListId', () => {
  test('returns the configured list ID', () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', 'test-key');
    vi.stubEnv('KLAVIYO_LIST_ID', 'test-list-id');
    expect(getKlaviyoListId()).toBe('test-list-id');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit lib/klaviyo/client.test.ts`
Expected: FAIL — `lib/klaviyo/client.ts` doesn't exist yet (`Cannot find module '@/lib/klaviyo/client'`).

- [ ] **Step 3: Implement the client**

Create `lib/klaviyo/client.ts`:

```typescript
const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
// Klaviyo requires a dated revision header on every request. Bump this
// alongside checking Klaviyo's changelog for breaking changes — see
// DECISIONS.md D-020.
const KLAVIYO_REVISION = '2026-07-15';

interface KlaviyoConfig {
  apiKey: string;
  listId: string;
}

/**
 * Reads and validates Klaviyo configuration from environment variables.
 * Throws only when called (never at module load), mirroring
 * lib/shopify/client.ts's getStorefrontClient() — so importing this file
 * never fails just because Klaviyo isn't configured yet. The thrown error
 * is expected to propagate to app/error.tsx once a real caller exists —
 * no separate "not configured" UI is built here.
 */
function getKlaviyoConfig(): KlaviyoConfig {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey || !listId) {
    throw new Error(
      'Klaviyo is not configured. Set KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID.',
    );
  }

  return { apiKey, listId };
}

/**
 * Sends a JSON:API POST request to a Klaviyo endpoint using the
 * configured private API key. Throws with the response status on
 * failure — callers let this propagate rather than swallowing it
 * (DECISIONS.md D-020's error-handling note).
 */
export async function klaviyoRequest(path: string, body: unknown): Promise<void> {
  const { apiKey } = getKlaviyoConfig();

  const response = await fetch(`${KLAVIYO_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      accept: 'application/json',
      'content-type': 'application/json',
      revision: KLAVIYO_REVISION,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Klaviyo request failed: ${response.status} ${response.statusText}`);
  }
}

export function getKlaviyoListId(): string {
  return getKlaviyoConfig().listId;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit lib/klaviyo/client.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Write the failing tests for subscribe**

Create `lib/klaviyo/subscribe.test.ts`:

```typescript
import { describe, expect, test, vi } from 'vitest';
import { subscribeToAccessList } from '@/lib/klaviyo/subscribe';
import * as clientModule from '@/lib/klaviyo/client';

describe('subscribeToAccessList', () => {
  test('sends the expected JSON:API request shape to Klaviyo', async () => {
    vi.spyOn(clientModule, 'getKlaviyoListId').mockReturnValue('test-list-id');
    const requestSpy = vi.spyOn(clientModule, 'klaviyoRequest').mockResolvedValue(undefined);

    await subscribeToAccessList('shopper@example.com');

    expect(requestSpy).toHaveBeenCalledWith('/profile-subscription-bulk-create-jobs/', {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Esque Access Gate — Request Access',
          historical_import: false,
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: 'shopper@example.com',
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: 'test-list-id',
            },
          },
        },
      },
    });
  });

  test('propagates the "not configured" error rather than attempting a request', async () => {
    vi.spyOn(clientModule, 'getKlaviyoListId').mockImplementation(() => {
      throw new Error(
        'Klaviyo is not configured. Set KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID.',
      );
    });

    await expect(subscribeToAccessList('shopper@example.com')).rejects.toThrow(
      'Klaviyo is not configured',
    );
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `pnpm test:unit lib/klaviyo/subscribe.test.ts`
Expected: FAIL — `lib/klaviyo/subscribe.ts` doesn't exist yet.

- [ ] **Step 7: Implement subscribe**

Create `lib/klaviyo/subscribe.ts`:

```typescript
import { klaviyoRequest, getKlaviyoListId } from './client';

/**
 * Subscribes `email` to the configured Klaviyo list with marketing
 * consent, via a direct REST call to Klaviyo's Subscribe Profiles
 * endpoint (verified against Klaviyo's current docs — the
 * `subscriptions.email.marketing.consent` shape, not the older flat
 * `marketing_newsletter` boolean some cached references still show).
 * See DECISIONS.md D-020 for why this uses fetch directly rather than
 * Klaviyo's Node SDK.
 *
 * first_name isn't sent here: this endpoint's documented profile
 * attributes cover identification (email/phone_number) and consent, not
 * name/properties — attaching a name to the Klaviyo profile would need a
 * separate profile-create/update call once a real Klaviyo account
 * justifies adding one. The Request Access form's first-name field is
 * still validated server-side (actions.ts's submitRequestAccess, Task 5);
 * it's just not forwarded to this specific call.
 */
export async function subscribeToAccessList(email: string): Promise<void> {
  const listId = getKlaviyoListId();

  await klaviyoRequest('/profile-subscription-bulk-create-jobs/', {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        custom_source: 'Esque Access Gate — Request Access',
        historical_import: false,
        profiles: {
          data: [
            {
              type: 'profile',
              attributes: {
                email,
                subscriptions: {
                  email: {
                    marketing: {
                      consent: 'SUBSCRIBED',
                    },
                  },
                },
              },
            },
          ],
        },
      },
      relationships: {
        list: {
          data: {
            type: 'list',
            id: listId,
          },
        },
      },
    },
  });
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `pnpm test:unit lib/klaviyo`
Expected: PASS (8 tests total across both files).

- [ ] **Step 9: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck`
Expected: all clean.

```bash
git add lib/klaviyo
git commit -m "feat: add Klaviyo client and access-list subscribe function

Mirrors lib/shopify/client.ts's lazy-throw pattern. Direct REST via
fetch, not Klaviyo's Node SDK (DECISIONS.md D-020, recorded in Task 8)."
```

---

## Task 3: Shared cookie constants and password validation Server Action

`validatePassword` is the core gate mechanism: on a match it sets the appropriate cookie(s) and redirects home; on no match it returns a plain result (never throws — a wrong password is an expected outcome, not a failure). The cookie *names* live in a small shared module so this file and Task 7's `proxy.ts` can never drift apart on the exact strings (ARCHITECTURE.md already names `lib/access/` for exactly this).

**Files:**
- Create: `lib/access/cookies.ts`
- Create: `app/(access)/access/actions.ts` (this task adds only `validatePassword`; Task 5 extends the same file with `submitRequestAccess`)
- Test: `app/(access)/access/actions.test.ts` (this task adds only `validatePassword`'s tests; Task 5 extends the same file)

**Interfaces:**
- Produces: `ACCESS_COOKIE_NAME`, `VIP_ACCESS_COOKIE_NAME`, `ACCESS_COOKIE_MAX_AGE_SECONDS` (from `lib/access/cookies.ts` — Task 7's `proxy.ts` imports these); `validatePassword(password: string): Promise<{ success: false }>` (Task 4's `AccessForm.tsx` calls this).

- [ ] **Step 1: Create the shared cookie constants (no test needed — plain constants)**

Create `lib/access/cookies.ts`:

```typescript
// Shared between actions.ts (sets these cookies on a correct password)
// and proxy.ts (checks for them on every request) — a single source of
// truth so the two can never drift out of sync on the exact names.
export const ACCESS_COOKIE_NAME = 'esque_access';
export const VIP_ACCESS_COOKIE_NAME = 'esque_vip_access';

// ~30 days, per ARCHITECTURE.md §6 / DESIGN_SYSTEM.md §57.
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
```

- [ ] **Step 2: Write the failing tests for validatePassword**

Create `app/(access)/access/actions.test.ts`:

```typescript
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { validatePassword } from './actions';

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

beforeEach(() => {
  mockCookieStore.set.mockClear();
});

describe('validatePassword', () => {
  test('sets the general access cookie and redirects on a matching general password', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    await expect(validatePassword('letmein')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'esque_access',
      '1',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }),
    );
  });

  test('sets both access cookies and redirects on a matching early-access password', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    await expect(validatePassword('vip-letmein')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_access', '1', expect.any(Object));
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_vip_access', '1', expect.any(Object));
  });

  test('returns { success: false } without setting cookies or redirecting on no match', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    const result = await validatePassword('wrong-password');

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('never matches an empty submitted password against an unset password env var', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', undefined);
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', undefined);

    const result = await validatePassword('');

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test:unit actions.test.ts`
Expected: FAIL — `app/(access)/access/actions.ts` doesn't exist yet.

- [ ] **Step 4: Implement validatePassword**

Create `app/(access)/access/actions.ts`:

```typescript
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ACCESS_COOKIE_NAME,
  VIP_ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/access/cookies';

export interface ValidatePasswordResult {
  success: false;
}

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
};

/**
 * Compares `password` against the general and early-access passwords
 * (plain string equality — intentionally not hashed/rate-limited; this is
 * a brand gate, not a security boundary, per CONTENT.md §5 and
 * DECISIONS.md D-005). On a match, sets the appropriate access cookie(s)
 * and redirects to `/`. redirect() throws internally by design (Next.js's
 * documented mechanism for triggering navigation from a Server Action,
 * verified against current docs) — this function never actually returns
 * on that path, so callers must never wrap it in a try/catch (that would
 * swallow the redirect). Only a non-matching password resolves normally,
 * with `{ success: false }` for the caller's branded incorrect-password
 * UI — never throws for a wrong password, since that's an expected
 * outcome, not a failure.
 */
export async function validatePassword(password: string): Promise<ValidatePasswordResult> {
  const generalPassword = process.env.ESQUE_ACCESS_PASSWORD;
  const earlyAccessPassword = process.env.ESQUE_EARLY_ACCESS_PASSWORD;
  const cookieStore = await cookies();

  // Early-access checked first: if an operator ever misconfigures both env
  // vars to the same value, this ordering still grants the higher tier
  // rather than silently downgrading it. Both branches guard on the env
  // var itself being truthy — without that, an unset ESQUE_ACCESS_PASSWORD
  // (empty string) would match an empty submitted password.
  if (earlyAccessPassword && password === earlyAccessPassword) {
    cookieStore.set(ACCESS_COOKIE_NAME, '1', cookieOptions);
    cookieStore.set(VIP_ACCESS_COOKIE_NAME, '1', cookieOptions);
    redirect('/');
  }

  if (generalPassword && password === generalPassword) {
    cookieStore.set(ACCESS_COOKIE_NAME, '1', cookieOptions);
    redirect('/');
  }

  return { success: false };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm test:unit actions.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck`
Expected: all clean.

```bash
git add lib/access "app/(access)/access/actions.ts" "app/(access)/access/actions.test.ts"
git commit -m "feat: add password validation Server Action and shared cookie constants"
```

---

## Task 4: Access page shell, Input primitive, and AccessForm

Builds the working password gate end-to-end: the `/access` route renders, submitting the correct password redirects home, an incorrect one shows branded rotating microcopy with the DESIGN_SYSTEM.md §56 shift/split animation. `Input` is a new shared primitive — ROADMAP.md Phase 1 explicitly deferred it "until Phase 4/6/10's search, request-access, and account forms" needed it; this is that trigger.

**Files:**
- Create: `components/ui/Input.tsx`
- Create: `app/(access)/access/page.tsx` (this task's version has no entrance motion yet — Task 6 adds it)
- Create: `app/(access)/access/AccessForm.tsx`
- Test: `app/(access)/access/AccessForm.test.ts` (tests only the exported `pickNextMessage` helper — no DOM/component-rendering test setup exists in this project; UI behavior is verified via Playwright below, matching how FullScreenMenu was tested)
- Modify: `app/globals.css` (incorrect-password shift/message keyframes)
- Create: `tests/e2e/access-gate.spec.ts`
- Modify: `.github/workflows/ci.yml` (add test-only password env vars to the `test:e2e` step)

**Interfaces:**
- Consumes: `validatePassword(password: string): Promise<{ success: false }>` (Task 3).
- Produces: `<Input label, ...InputHTMLAttributes>` (Task 5's `RequestAccessForm` reuses this); `pickNextMessage(lastMessage: string | null): string` (exported from `AccessForm.tsx` for its own test); `AccessForm` renders a `showRequestAccess` toggle that Task 5's `RequestAccessForm` slots into.

- [ ] **Step 1: Write the failing test for the message-rotation helper**

Create `app/(access)/access/AccessForm.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import { pickNextMessage, INCORRECT_PASSWORD_MESSAGES } from './AccessForm';

describe('pickNextMessage', () => {
  test('returns one of the five approved CONTENT.md §5 lines', () => {
    const message = pickNextMessage(null);
    expect(INCORRECT_PASSWORD_MESSAGES).toContain(message);
  });

  test('never immediately repeats the last message shown', () => {
    for (const last of INCORRECT_PASSWORD_MESSAGES) {
      for (let i = 0; i < 20; i++) {
        expect(pickNextMessage(last)).not.toBe(last);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit AccessForm.test.ts`
Expected: FAIL — `app/(access)/access/AccessForm.tsx` doesn't exist yet.

- [ ] **Step 3: Create the Input primitive**

Create `components/ui/Input.tsx`:

```tsx
import type { InputHTMLAttributes, Ref } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  ref?: Ref<HTMLInputElement>;
}

// Mirrors Button.tsx's focusRing constant — DESIGN_SYSTEM.md §22 / PROJECT.md
// §78's visible-focus requirement applies to every interactive element, not
// just buttons. --color-esque-text per DECISIONS.md D-010's contrast ruling.
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text';

// Deferred since ROADMAP.md Phase 1 ("no real consumer exists until Phase
// 4/6/10's search, request-access, and account forms") — the access
// gate's password/first-name/email fields (Phase 6) are that consumer.
export function Input({ label, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-2 text-left">
      <label
        htmlFor={inputId}
        className="text-utility tracking-metadata uppercase text-esque-text-secondary"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-none border border-esque-text-secondary bg-transparent px-4 py-3 text-body text-esque-text transition-colors duration-200 ease-esque focus:border-esque-text ${focusRing} ${className}`.trim()}
        {...props}
      />
    </div>
  );
}
```

- [ ] **Step 4: Add the incorrect-password animation keyframes**

Modify `app/globals.css` — add after the existing `.esque-menu[data-open='true']` block (end of file):

```css

/* Incorrect-password animation — DESIGN_SYSTEM.md §56: text briefly splits
   horizontally, the field shifts ~3-5px, then the message appears. A single
   gentle nudge-and-return (not an oscillating shake) per the spec's explicit
   "avoid aggressive shaking" instruction. Both are plain CSS @keyframes, so
   the existing global `@media (prefers-reduced-motion: reduce)` rule above
   (which zeroes all animation-duration) already covers them — no separate
   reduced-motion handling needed here, unlike EntranceMotion's JS-driven
   motion/react animations (Task 6), which bypass CSS animation properties
   entirely and need their own explicit useReducedMotion() check. */
@keyframes esque-access-error-shift {
  0% {
    transform: translateX(0);
  }
  40% {
    transform: translateX(-4px);
  }
  100% {
    transform: translateX(0);
  }
}

.esque-access-error-shift {
  animation: esque-access-error-shift 300ms var(--ease-esque);
}

@keyframes esque-access-error-message {
  from {
    letter-spacing: 0.5em;
    opacity: 0;
  }
  to {
    letter-spacing: var(--tracking-metadata);
    opacity: 1;
  }
}

.esque-access-error-message {
  animation: esque-access-error-message 350ms var(--ease-esque);
  animation-delay: 80ms;
}
```

- [ ] **Step 5: Create a placeholder RequestAccessForm so AccessForm's import resolves**

`AccessForm` (next step) imports `RequestAccessForm` — it must exist on disk before AccessForm.tsx can be loaded at all (a missing module fails at import/resolution time, not typecheck time, so this has to come first, not after). Task 5 replaces its contents entirely.

Create `app/(access)/access/RequestAccessForm.tsx`:

```tsx
'use client';

// Placeholder — replaced in full by Task 5. Exists now only so AccessForm's
// import resolves for this task's own test/typecheck/build/E2E validation.
export function RequestAccessForm({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack}>
      Back
    </button>
  );
}
```

- [ ] **Step 6: Implement AccessForm**

Create `app/(access)/access/AccessForm.tsx`:

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validatePassword } from './actions';
import { RequestAccessForm } from './RequestAccessForm';

// CONTENT.md §5 — never the generic "Incorrect password.", and never an
// immediate repeat of the last line shown.
export const INCORRECT_PASSWORD_MESSAGES = [
  'NOT THIS ONE.',
  'ACCESS NOT RECOGNIZED.',
  'TRY ANOTHER.',
  'ACCESS DENIED.',
  'TRY AGAIN.',
] as const;

export function pickNextMessage(lastMessage: string | null): string {
  const candidates = lastMessage
    ? INCORRECT_PASSWORD_MESSAGES.filter((message) => message !== lastMessage)
    : INCORRECT_PASSWORD_MESSAGES;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export function AccessForm() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Toggle owned here (not a separate wrapper component) so the entry
  // screen and the Request Access screen share one interactive unit — the
  // spec names AccessForm/RequestAccessForm as the two Client Components;
  // nothing in it requires a third file just to hold this one boolean.
  const [showRequestAccess, setShowRequestAccess] = useState(false);

  if (showRequestAccess) {
    return <RequestAccessForm onBack={() => setShowRequestAccess(false)} />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    // A correct password redirects server-side via next/navigation's
    // redirect() inside validatePassword, which throws internally to
    // trigger client-side navigation (verified Next.js behavior) — this
    // call is deliberately NOT wrapped in try/catch, which would swallow
    // that redirect. Execution only reaches the lines below when the
    // password was wrong (validatePassword resolved normally instead).
    await validatePassword(password);
    setIsSubmitting(false);
    setErrorMessage((previous) => pickNextMessage(previous));
    setAttempt((count) => count + 1);
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h1 className="font-display text-display-l tracking-display text-esque-text">
        ENTER ESQUE
      </h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
        {/* Re-keyed per attempt so the shift animation restarts on every
            failure, even repeated ones with the CSS class name unchanged. */}
        <div key={attempt} className={attempt > 0 ? 'esque-access-error-shift' : undefined}>
          <Input
            label="PASSWORD"
            type="password"
            name="password"
            autoComplete="off"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {errorMessage && (
          <p
            key={`${errorMessage}-${attempt}`}
            role="alert"
            className="esque-access-error-message text-utility uppercase tracking-metadata text-esque-error"
          >
            {errorMessage}
          </p>
        )}
        <div className="flex items-center justify-center gap-4">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            ENTER
          </Button>
          <Button type="button" variant="editorial" onClick={() => setShowRequestAccess(true)}>
            REQUEST ACCESS
          </Button>
        </div>
      </form>
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        ACCESS TO CURRENT COLLECTIONS.
      </p>
    </div>
  );
}
```

- [ ] **Step 7: Run to verify the unit test passes**

Run: `pnpm test:unit AccessForm.test.ts`
Expected: PASS (2 tests) — Step 5's placeholder makes AccessForm.tsx's import resolve, so both the module load and `pickNextMessage`'s own logic succeed.

- [ ] **Step 8: Create the access page**

Create `app/(access)/access/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { AccessForm } from './AccessForm';

// A gate/utility page, not real content — excluded from indexing. Crawlers
// still reach it directly if they discover the literal URL (proxy.ts lets
// bots through everywhere, including here), but it's not worth surfacing
// as a search result. Doesn't affect the SEO rule this feature must
// preserve (DECISIONS.md D-005): that's about product/collection routes
// staying crawlable, not about this specific utility page being indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccessPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-esque-black px-4 py-16">
      <AccessForm />
    </div>
  );
}
```

- [ ] **Step 9: Add CI env vars the E2E tests below need**

Modify `.github/workflows/ci.yml` — the `test:e2e` step needs real (test-fixture) password values so Playwright's `webServer`-spawned dev server can actually grant access:

```yaml
      - run: pnpm test:e2e
        env:
          ESQUE_ACCESS_PASSWORD: ci-test-general-password
          ESQUE_EARLY_ACCESS_PASSWORD: ci-test-vip-password
```

(Replaces the existing bare `- run: pnpm test:e2e` line. These are obviously-fake CI test fixtures, not production secrets — safe to commit per CLAUDE.md's secret-handling rules. Local development needs the same two variables in `.env.local`, already scaffolded empty in `.env.local.example`.)

- [ ] **Step 10: Write the E2E tests for the password gate**

Create `tests/e2e/access-gate.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('access gate — password entry', () => {
  test('renders ENTER ESQUE with a password field and both buttons', async ({ page }) => {
    await page.goto('/access');
    await expect(page.getByRole('heading', { name: 'ENTER ESQUE' })).toBeVisible();
    await expect(page.getByLabel('PASSWORD')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ENTER' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'REQUEST ACCESS' })).toBeVisible();
    await expect(page.getByText('ACCESS TO CURRENT COLLECTIONS.')).toBeVisible();
  });

  test('the correct general password grants access and redirects home', async ({ page }) => {
    await page.goto('/access');
    await page.getByLabel('PASSWORD').fill('ci-test-general-password');
    await page.getByRole('button', { name: 'ENTER' }).click();

    await expect(page).toHaveURL('/');
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'esque_access')).toBeTruthy();
    expect(cookies.find((c) => c.name === 'esque_vip_access')).toBeFalsy();
  });

  test('the correct early-access password grants both access cookies and redirects home', async ({
    page,
  }) => {
    await page.goto('/access');
    await page.getByLabel('PASSWORD').fill('ci-test-vip-password');
    await page.getByRole('button', { name: 'ENTER' }).click();

    await expect(page).toHaveURL('/');
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'esque_access')).toBeTruthy();
    expect(cookies.find((c) => c.name === 'esque_vip_access')).toBeTruthy();
  });

  test('an incorrect password shows a branded line, not a generic message, and does not navigate', async ({
    page,
  }) => {
    await page.goto('/access');
    await page.getByLabel('PASSWORD').fill('definitely-wrong');
    await page.getByRole('button', { name: 'ENTER' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    const messages = [
      'NOT THIS ONE.',
      'ACCESS NOT RECOGNIZED.',
      'TRY ANOTHER.',
      'ACCESS DENIED.',
      'TRY AGAIN.',
    ];
    await expect(alert).toHaveText(new RegExp(messages.join('|')));
    await expect(page).toHaveURL(/\/access$/);
  });

  test('respects prefers-reduced-motion for the incorrect-password animation', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/access');
    await page.getByLabel('PASSWORD').fill('definitely-wrong');
    await page.getByRole('button', { name: 'ENTER' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    const duration = await alert.evaluate((el) => getComputedStyle(el).animationDuration);
    expect(duration === '0s' || parseFloat(duration) < 0.05).toBe(true);
  });
});
```

- [ ] **Step 11: Run to verify it fails, then passes**

Run: `pnpm test:e2e access-gate.spec.ts`
Expected first: FAIL (route/behavior not fully wired — e.g. `getByLabel('PASSWORD')` or the cookie assertions). After Steps 3–9 above are in place: PASS (5 tests × 2 projects).

- [ ] **Step 12: Full validation and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test:e2e`
Expected: all clean (`build`/`typecheck` succeed because Step 5's placeholder `RequestAccessForm` makes the import resolve; Task 5 replaces it with the real implementation).

```bash
git add components/ui/Input.tsx "app/(access)/access" app/globals.css tests/e2e/access-gate.spec.ts .github/workflows/ci.yml
git commit -m "feat: add access page, Input primitive, and password entry (AccessForm)

Implements ROADMAP.md Phase 6's password-entry UI and branded
incorrect-password microcopy end-to-end. RequestAccessForm is a
placeholder here, replaced in full by the next task."
```

---

## Task 5: Request Access form (Klaviyo submission)

Replaces Task 4's placeholder `RequestAccessForm` with the real form: `FIRST NAME` / `EMAIL` / consent checkbox, submitting to a new `submitRequestAccess` Server Action that validates input server-side and calls Task 2's `subscribeToAccessList`.

**Files:**
- Modify: `app/(access)/access/actions.ts` (add `submitRequestAccess`)
- Modify: `app/(access)/access/actions.test.ts` (add its tests)
- Modify: `app/(access)/access/RequestAccessForm.tsx` (replace the placeholder)
- Modify: `tests/e2e/access-gate.spec.ts` (add its E2E coverage)

**Interfaces:**
- Consumes: `subscribeToAccessList(email: string): Promise<void>` (Task 2).
- Produces: `RequestAccessState = { success: boolean; error?: string }`, `submitRequestAccess(prevState: RequestAccessState, formData: FormData): Promise<RequestAccessState>` — used only within this task's own `RequestAccessForm.tsx`.

- [ ] **Step 1: Write the failing tests for submitRequestAccess**

Modify `app/(access)/access/actions.test.ts` — add below the existing `validatePassword` describe block (and add `subscribeToAccessList` to the mocks):

```typescript
import { submitRequestAccess } from './actions';
import * as subscribeModule from '@/lib/klaviyo/subscribe';

// (add alongside the existing imports at the top of the file)
```

```typescript
describe('submitRequestAccess', () => {
  function formData(fields: Record<string, string>) {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      data.set(key, value);
    }
    return data;
  }

  test('returns a validation error when firstName is missing', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ email: 'a@example.com', consent: 'on' }),
    );
    expect(result).toEqual({ success: false, error: 'First name is required.' });
  });

  test('returns a validation error when email is missing', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', consent: 'on' }),
    );
    expect(result).toEqual({ success: false, error: 'Email is required.' });
  });

  test('returns a validation error when consent is not checked', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', email: 'a@example.com' }),
    );
    expect(result).toEqual({
      success: false,
      error: 'Consent is required to request access.',
    });
  });

  test('calls subscribeToAccessList and returns success when all fields are valid', async () => {
    const subscribeSpy = vi
      .spyOn(subscribeModule, 'subscribeToAccessList')
      .mockResolvedValue(undefined);

    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', email: 'sam@example.com', consent: 'on' }),
    );

    expect(subscribeSpy).toHaveBeenCalledWith('sam@example.com');
    expect(result).toEqual({ success: true });
  });

  test('throws (does not swallow) when subscribeToAccessList fails — a genuine failure, not a validation outcome', async () => {
    vi.spyOn(subscribeModule, 'subscribeToAccessList').mockRejectedValue(
      new Error('Klaviyo request failed: 500 Internal Server Error'),
    );

    await expect(
      submitRequestAccess(
        { success: false },
        formData({ firstName: 'Sam', email: 'sam@example.com', consent: 'on' }),
      ),
    ).rejects.toThrow('Klaviyo request failed');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit actions.test.ts`
Expected: FAIL — `submitRequestAccess` is not exported yet.

- [ ] **Step 3: Implement submitRequestAccess**

Modify `app/(access)/access/actions.ts` — add the import and the new export:

```typescript
import { subscribeToAccessList } from '@/lib/klaviyo/subscribe';
```

```typescript
export interface RequestAccessState {
  success: boolean;
  error?: string;
}

/**
 * Validates the Request Access form's fields server-side (native HTML
 * `required` attributes are the first line of defense client-side, but
 * "client-side checks are not authorization" — this is the real
 * boundary). Missing/invalid input is an expected, recoverable outcome
 * and is returned as state (Next.js's own recommended pattern for form
 * validation with useActionState), not thrown.
 *
 * A genuine failure calling Klaviyo (not configured, or a real API
 * error) is different: that throws through to the nearest error.tsx
 * boundary rather than being modeled as a return value, per Next.js's
 * own distinction between expected and uncaught/unexpected errors, and
 * per this feature's design spec's Error Handling section.
 */
export async function submitRequestAccess(
  _prevState: RequestAccessState,
  formData: FormData,
): Promise<RequestAccessState> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const consent = formData.get('consent') === 'on';

  if (!firstName) {
    return { success: false, error: 'First name is required.' };
  }
  if (!email) {
    return { success: false, error: 'Email is required.' };
  }
  if (!consent) {
    return { success: false, error: 'Consent is required to request access.' };
  }

  await subscribeToAccessList(email);

  return { success: true };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit actions.test.ts`
Expected: PASS (9 tests total — 4 from Task 3 plus 5 above).

- [ ] **Step 5: Implement the real RequestAccessForm**

Replace the full contents of `app/(access)/access/RequestAccessForm.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submitRequestAccess, type RequestAccessState } from './actions';

const initialState: RequestAccessState = { success: false };

export function RequestAccessForm({ onBack }: { onBack: () => void }) {
  const [state, formAction, pending] = useActionState(submitRequestAccess, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-display text-heading-2 tracking-display text-esque-text">
          ACCESS SENT.
        </p>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          CHECK YOUR EMAIL.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-4 text-center">
      <Input label="FIRST NAME" name="firstName" required autoComplete="given-name" />
      <Input label="EMAIL" name="email" type="email" required autoComplete="email" />
      <label className="flex items-start gap-2 text-left text-utility text-esque-text-secondary">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        />
        I agree to receive Esque emails, including access and collection updates.
      </label>
      {state.error && (
        <p role="alert" className="text-utility uppercase tracking-metadata text-esque-error">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-center gap-4">
        <Button type="submit" variant="primary" disabled={pending}>
          REQUEST ACCESS
        </Button>
        <Button type="button" variant="editorial" onClick={onBack} disabled={pending}>
          Back
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Add E2E coverage**

Modify `tests/e2e/access-gate.spec.ts` — add a new `test.describe` block:

```typescript
test.describe('access gate — request access', () => {
  test('REQUEST ACCESS on the entry screen reveals the request-access form', async ({ page }) => {
    await page.goto('/access');
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();

    await expect(page.getByLabel('FIRST NAME')).toBeVisible();
    await expect(page.getByLabel('EMAIL')).toBeVisible();
    await expect(
      page.getByText('I agree to receive Esque emails, including access and collection updates.'),
    ).toBeVisible();
  });

  test('submitting with valid input but Klaviyo not configured surfaces the error boundary honestly', async ({
    page,
  }) => {
    // KLAVIYO_PRIVATE_API_KEY/KLAVIYO_LIST_ID are intentionally unset in
    // this test run (mirroring the real current project state — no
    // Klaviyo account exists yet, per the design spec's explicit scope).
    // subscribeToAccessList throws, which is a genuine failure per
    // actions.ts's own documented distinction — surfacing the existing,
    // already-tested error.tsx boundary is the correct, honest behavior,
    // not a workaround.
    await page.goto('/access');
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();
    await page.getByLabel('FIRST NAME').fill('Sam');
    await page.getByLabel('EMAIL').fill('sam@example.com');
    await page.getByText('I agree to receive Esque emails').click();
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();

    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });
});
```

- [ ] **Step 7: Run to verify it passes**

Run: `pnpm test:e2e access-gate.spec.ts`
Expected: PASS (all tests in the file, including Task 4's).

- [ ] **Step 8: Full validation and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test:e2e`
Expected: all clean.

```bash
git add "app/(access)/access/actions.ts" "app/(access)/access/actions.test.ts" "app/(access)/access/RequestAccessForm.tsx" tests/e2e/access-gate.spec.ts
git commit -m "feat: implement Request Access form with server-side validation and Klaviyo submission"
```

---

## Task 6: Entrance motion

The full layered entrance sequence from the design spec (DESIGN_SYSTEM.md §53): black base → abstract SVG garment silhouettes with cursor-reactive parallax → giant background ESQUE typography → the password UI on top (already built). Uses `motion` (ARCHITECTURE.md's pre-approved choice), installed here for the first time in this project.

**Files:**
- Create: `app/(access)/access/EntranceMotion.tsx`
- Modify: `app/(access)/access/page.tsx` (add `EntranceMotion`)
- Modify: `package.json` / `pnpm-lock.yaml` (add `motion`)
- Modify: `tests/e2e/access-gate.spec.ts` (add its E2E coverage)

**Interfaces:**
- Produces: `EntranceMotion` (named export from its own file), rendered by `page.tsx` as a background layer behind `AccessForm`.

- [ ] **Step 1: Add the dependency**

Run: `pnpm add motion`
Expected: `motion` added to `package.json` dependencies (already listed in ARCHITECTURE.md's tech-stack table — no new approval needed, this is its first actual use).

- [ ] **Step 2: Implement EntranceMotion**

Create `app/(access)/access/EntranceMotion.tsx`:

```tsx
'use client';

import { useReducedMotion, useMotionValue, useTransform, motion } from 'motion/react';
import type { PointerEvent } from 'react';

// Esque's own easing curve (app/globals.css --ease-esque), expressed as the
// numeric cubic-bezier motion/react's `transition.ease` accepts, so the
// JS-driven entrance matches the rest of the project's CSS-driven motion.
const ESQUE_EASE = [0.22, 1, 0.36, 1] as const;

// Simple abstract SVG silhouettes (placeholder imagery — see this
// feature's design spec) at three depths. Depth scales how far each layer
// moves under cursor parallax: closer layers (higher depth) move more.
const SILHOUETTE_LAYERS = [
  {
    depth: 0.3,
    className: 'left-[8%] top-[12%] h-[70vh] w-auto text-esque-forest/25',
    viewBox: '0 0 200 560',
    path: 'M100 40 C 60 40 40 90 45 160 L 35 480 C 33 520 167 520 165 480 L 155 160 C 160 90 140 40 100 40 Z',
  },
  {
    depth: 0.6,
    className: 'right-[10%] top-[18%] h-[55vh] w-auto text-esque-elevated',
    viewBox: '0 0 200 510',
    path: 'M100 30 C 80 30 70 60 72 90 L 60 200 C 20 260 10 420 30 480 L 170 480 C 190 420 180 260 140 200 L 128 90 C 130 60 120 30 100 30 Z',
  },
  {
    depth: 1.0,
    className: 'left-[42%] bottom-[6%] h-[40vh] w-auto text-esque-text-muted/60',
    viewBox: '0 0 200 500',
    path: 'M40 20 L 160 20 L 165 240 L 110 240 L 100 480 L 80 480 L 90 240 L 35 240 Z',
  },
] as const;

function SilhouetteLayer({
  layer,
  pointerX,
  pointerY,
  prefersReducedMotion,
}: {
  layer: (typeof SILHOUETTE_LAYERS)[number];
  pointerX: ReturnType<typeof useMotionValue<number>>;
  pointerY: ReturnType<typeof useMotionValue<number>>;
  prefersReducedMotion: boolean | null;
}) {
  // Rules of Hooks: called unconditionally regardless of reduced-motion —
  // whether the result is applied to `style` is what's conditional below.
  const x = useTransform(pointerX, [-1, 1], [-24 * layer.depth, 24 * layer.depth]);
  const y = useTransform(pointerY, [-1, 1], [-14 * layer.depth, 14 * layer.depth]);

  return (
    <motion.svg
      viewBox={layer.viewBox}
      fill="currentColor"
      style={prefersReducedMotion ? undefined : { x, y }}
      className={`absolute ${layer.className}`}
    >
      <path d={layer.path} />
    </motion.svg>
  );
}

export function EntranceMotion() {
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return;
    const { innerWidth, innerHeight } = window;
    // Normalize to roughly [-1, 1] from viewport center.
    pointerX.set((event.clientX / innerWidth) * 2 - 1);
    pointerY.set((event.clientY / innerHeight) * 2 - 1);
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
    >
      {SILHOUETTE_LAYERS.map((layer) => (
        <SilhouetteLayer
          key={layer.depth}
          layer={layer}
          pointerX={pointerX}
          pointerY={pointerY}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
      {/* Giant background typography (DESIGN_SYSTEM.md §53 layer 4) — large
          and low-opacity so it reads as atmosphere, distinct from
          AccessForm's smaller, sharp "ENTER ESQUE" functional heading on
          top of it. Quick per PROJECT.md §14: "Motion must remain quick...
          never become an obstacle for returning users." */}
      <motion.h2
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: ESQUE_EASE }}
        className="absolute inset-0 flex items-center justify-center font-display text-display-xl tracking-display text-esque-text/15"
      >
        ESQUE
      </motion.h2>
    </div>
  );
}
```

- [ ] **Step 3: Wire it into the page, behind AccessForm**

Modify `app/(access)/access/page.tsx` (keeps Step 8/Task 4's `metadata` export unchanged, only adds `EntranceMotion`):

```tsx
import type { Metadata } from 'next';
import { EntranceMotion } from './EntranceMotion';
import { AccessForm } from './AccessForm';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccessPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-esque-black px-4 py-16">
      <EntranceMotion />
      <div className="relative z-10">
        <AccessForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add E2E coverage**

Modify `tests/e2e/access-gate.spec.ts` — add a new `test.describe` block:

```typescript
test.describe('access gate — entrance motion', () => {
  test('renders the background silhouettes and ESQUE typography behind the form', async ({
    page,
  }) => {
    await page.goto('/access');
    const entrance = page.locator('div[aria-hidden="true"]').first();
    await expect(entrance.locator('svg')).toHaveCount(3);
    await expect(page.getByText('ESQUE', { exact: true }).first()).toBeVisible();
  });

  test('respects prefers-reduced-motion: the typography renders instantly and cursor parallax is disabled', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/access');

    const heading = page.getByText('ESQUE', { exact: true }).first();
    await expect(heading).toHaveCSS('opacity', '1');

    // Move the pointer and confirm the silhouette layers do not receive a
    // transform-driven offset (motion/react's inline style, not a CSS
    // transition the global reduced-motion rule already covers).
    await page.mouse.move(100, 100);
    await page.mouse.move(800, 50);
    const svg = page.locator('div[aria-hidden="true"] svg').first();
    const transform = await svg.evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });
});
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm test:e2e access-gate.spec.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 6: Full validation and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test:e2e`
Expected: all clean.

```bash
git add "app/(access)/access/EntranceMotion.tsx" "app/(access)/access/page.tsx" package.json pnpm-lock.yaml tests/e2e/access-gate.spec.ts
git commit -m "feat: add entrance motion (silhouettes, cursor parallax, typography)"
```

---

## Task 7: Proxy gate enforcement

The actual gate: redirects ungated human visitors to `/access`, lets crawlers through unconditionally, and never gates `/access` itself. This is the point at which visiting `/` (and every other route) actually requires access — so it must also fix the existing `smoke.spec.ts` suite, which currently visits `/` with no cookie set up.

**Files:**
- Create: `proxy.ts`
- Modify: `package.json` / `pnpm-lock.yaml` (add `isbot`)
- Modify: `tests/e2e/smoke.spec.ts` (pre-set the access cookie so existing tests keep exercising the already-past-the-gate state)
- Modify: `tests/e2e/access-gate.spec.ts` (add bot-passthrough and redirect coverage)

**Interfaces:**
- Consumes: `ACCESS_COOKIE_NAME`, `VIP_ACCESS_COOKIE_NAME` (Task 3's `lib/access/cookies.ts`).

- [ ] **Step 1: Add the dependency**

Run: `pnpm add isbot`
Expected: `isbot` added to `package.json` dependencies.

- [ ] **Step 2: Implement the proxy**

Create `proxy.ts`:

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { isBot } from 'isbot';
import { ACCESS_COOKIE_NAME, VIP_ACCESS_COOKIE_NAME } from '@/lib/access/cookies';

// Next.js renamed Middleware to Proxy (proxy.ts, Node.js runtime, not Edge)
// — verified against current docs, not the deprecated middleware.ts
// convention. See DECISIONS.md D-018.
export function proxy(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? '';

  // Crawlers always pass through, regardless of cookie state — the access
  // gate is a UI-layer experience for human visitors, never an SEO wall.
  // See ARCHITECTURE.md §6, DECISIONS.md D-005, D-019.
  if (isBot(userAgent)) {
    return NextResponse.next();
  }

  const hasAccess =
    request.cookies.has(ACCESS_COOKIE_NAME) || request.cookies.has(VIP_ACCESS_COOKIE_NAME);
  if (hasAccess) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/access';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /access (the gate page itself — avoids a redirect loop)
     * - api (route handlers, if any need to bypass the gate)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico (metadata file)
     */
    '/((?!access|api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

- [ ] **Step 3: Fix the existing smoke suite to start already past the gate**

Modify `tests/e2e/smoke.spec.ts` — add near the top of the file, after the existing `import` line:

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  // The proxy (proxy.ts) now redirects any ungated request to /access.
  // This suite exercises the storefront shell itself (Header, FullScreenMenu,
  // Footer, homepage) — not the gate, which has its own dedicated coverage
  // in access-gate.spec.ts — so every test here starts as an already-granted
  // returning visitor, exactly like access-gate.spec.ts's own tests prove
  // that state is reachable in the first place.
  await context.addCookies([
    { name: 'esque_access', value: '1', url: 'http://localhost:3000' },
  ]);
});
```

(This adds a `test.beforeEach` block; the rest of the file's existing `test.describe`/`test` blocks are unchanged.)

- [ ] **Step 4: Add bot-passthrough and redirect E2E coverage**

Modify `tests/e2e/access-gate.spec.ts` — add a new `test.describe` block:

```typescript
test.describe('access gate — proxy enforcement', () => {
  test('an ungated request to / redirects to /access', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/access$/);
  });

  test('a simulated crawler reaches the homepage with no access cookie set', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    });
    const page = await context.newPage();

    await page.goto('/');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'ESQUE' })).toBeVisible();
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'esque_access')).toBeFalsy();
    await context.close();
  });

  test('a granted visitor is not redirected away from /', async ({ page, context }) => {
    await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });
});
```

- [ ] **Step 5: Run to verify it fails, then passes**

Run: `pnpm test:e2e`
Expected first (before Step 2's `proxy.ts` exists): the new redirect/crawler tests FAIL. After Steps 2–4: the full suite (`smoke.spec.ts` + `access-gate.spec.ts`) PASSES — both existing tests (now pre-cookied) and all new gate tests.

- [ ] **Step 6: Full validation and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test:e2e`
Expected: all clean.

```bash
git add proxy.ts package.json pnpm-lock.yaml tests/e2e/smoke.spec.ts tests/e2e/access-gate.spec.ts
git commit -m "feat: enforce the access gate via Proxy, with crawler bypass

Fixes tests/e2e/smoke.spec.ts to pre-set the access cookie now that an
ungated request to any route (including /) redirects to /access."
```

---

## Task 8: Record decisions and update the roadmap

**Files:**
- Modify: `DECISIONS.md`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Add D-018, D-019, D-020**

Modify `DECISIONS.md` — append after the existing D-017 entry:

```markdown

---

## D-018 — Next.js Proxy (not Middleware) for access-gate enforcement

**Decision:** Gate enforcement lives in `proxy.ts` at the repo root, exporting a named `proxy(request: NextRequest)` function, running on the Node.js runtime.

**Reason:** Next.js renamed Middleware to Proxy as of the version this project pins (16.3.1) — confirmed against current Next.js docs, not assumed from training data, which still overwhelmingly reflects the deprecated `middleware.ts`/`export function middleware()` convention. Next.js ships a codemod (`npx @next/codemod@canary middleware-to-proxy .`) for projects migrating off the old convention; this project adopts the current one directly since it never had a `middleware.ts` to migrate from.

---

## D-019 — `isbot` for crawler detection

**Decision:** Use the `isbot` package (`isBot(userAgentString): boolean`) in `proxy.ts` to let crawlers bypass the access gate unconditionally, rather than a hand-maintained user-agent pattern list.

**Reason:** ARCHITECTURE.md §6 and DECISIONS.md D-005 require the gate to never block crawlers, regardless of cookie state — this is what keeps product/collection routes indexable once they exist (ROADMAP.md Phase 4/5). SEO correctness depends on this list staying current as crawlers change their user-agent strings over time; `isbot` is small, actively maintained (millions of weekly downloads), and purpose-built for exactly this, which a one-off in-house regex would not keep pace with as reliably.

---

## D-020 — Klaviyo integration via direct REST calls, not the official Node SDK

**Decision:** `lib/klaviyo/client.ts` calls Klaviyo's REST API directly via `fetch` (`POST /api/profile-subscription-bulk-create-jobs/`), rather than adding `@klaviyo/klaviyo-api-node` or an equivalent SDK dependency.

**Reason:** Mirrors the same reasoning already applied to Shopify's lightweight client choice (D-015): this integration needs exactly one endpoint (subscribing a profile to a list with marketing consent), and a single documented REST call doesn't justify a heavier dependency. Verified against Klaviyo's current docs directly — including resolving a real discrepancy mid-implementation between an older, now-superseded flat `subscriptions.email.marketing_newsletter: boolean` shape that some cached references still show, and the current `subscriptions.email.marketing.consent: "SUBSCRIBED"` shape (confirmed across four independent current examples, including Klaviyo's own changelog documenting the shape change). This pass covers only the list-subscription mechanism; the transactional "here's your access password" email (CONTENT.md §4's access-email structure) is not built — like Shopify's store, it needs the project owner's own Klaviyo account and a real email template/flow to exist first, mirroring D-016's reasoning for why cart/checkout were deferred pending a real Shopify store. `first_name` is collected and validated server-side but not forwarded to Klaviyo: the Subscribe Profiles endpoint's documented profile attributes cover identification and consent only, not name — attaching a name would need a separate profile-update call once a real account justifies adding one.
```

- [ ] **Step 2: Update ROADMAP.md Phase 6**

Modify `ROADMAP.md` — replace the Phase 6 block:

```markdown
## Phase 6 — Access Gate

- [x] Password entry UI + branded incorrect-password microcopy
- [x] Access cookie (~30 day persistence), separate VIP/early-access claim
- [~] Request Access form → Klaviyo list + password email — form submits to Klaviyo's list-subscription API with marketing consent (see DECISIONS.md D-020); the transactional password-delivery email itself is not yet built, since it needs a real Klaviyo account/email template that doesn't exist yet (same dependency D-016 already noted for Shopify checkout)
- [x] Confirm SEO rule: product/collection routes stay crawlable regardless of access state ([DECISIONS.md D-005](./DECISIONS.md#d-005--access-gate-is-a-ui-layer-experience-not-an-seo-wall)) — verified architecturally (crawler bypass + homepage placeholder), since no real product/collection page exists yet (Phase 4/5)
```

- [ ] **Step 3: Validate and commit**

Run: `pnpm format:check`
Expected: clean (Markdown files aren't linted/typechecked, but Prettier does format them in this project — confirm no reformatting diff beyond the intended edits).

```bash
git add DECISIONS.md ROADMAP.md
git commit -m "docs: record D-018/D-019/D-020, update ROADMAP Phase 6"
```

---

## Task 9: Final validation

- [ ] **Step 1: Run the complete validation suite**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test:e2e`
Expected: every command exits 0. Unit test count should include all of Tasks 2/3/4/5's new tests; E2E should include the full `smoke.spec.ts` (now pre-cookied) plus every `access-gate.spec.ts` block from Tasks 4–7.

- [ ] **Step 2: Manually sanity-check the dev server**

Run: `pnpm dev`, then in a browser:
- Visit `/` with no cookies → confirm redirect to `/access`.
- Confirm the entrance sequence (silhouettes + ESQUE background type) renders, and moving the cursor visibly shifts the silhouette layers at different rates.
- Enter the wrong password twice in a row → confirm two different branded lines appear (not the same one twice), with the shift + text-split animation.
- Enter `ESQUE_ACCESS_PASSWORD`'s real local value → confirm redirect to `/` and the homepage now renders (cookie granted).
- Click REQUEST ACCESS, fill the form, submit → confirm the error boundary appears (Klaviyo unconfigured locally, unless real credentials were provided) with "SOMETHING WENT WRONG." and a working Retry button.
- Toggle `prefers-reduced-motion` in browser devtools and repeat the entrance-sequence and incorrect-password checks → confirm both are instant/static.

Stop the dev server afterward.

- [ ] **Step 3: Review the full diff**

This branch (`worktree-foundation-shell`) already diverged from `main` before this plan started (the full Shopify Commerce Foundation phase, plus this feature's own design spec, commit `bdd61b1`) — reviewing `main..HEAD` would include all of that, not just this plan's work. Review only what Tasks 1–8 actually added:

Run: `git log --oneline bdd61b1..HEAD` and `git diff bdd61b1..HEAD --stat`
Expected: one commit per task (Tasks 1–8, roughly 8–9 commits depending on any fix-round commits), touching only the files listed in each task's own **Files:** block above; no unrelated files touched.

- [ ] **Step 4: Confirm nothing was missed against the spec**

Re-read `docs/superpowers/specs/2026-08-22-access-gate-design.md` section by section and confirm each is implemented: Architecture (Proxy, route structure, password/cookies, Klaviyo, entrance motion, incorrect-password animation), Content (verbatim copy), Error Handling, Testing (unit + E2E), New Architectural Decisions, Explicitly Open/Out of Scope (confirm nothing out-of-scope was accidentally built — no rate-limiting, no Esque Private, no real scheduling, no model footage, no password email).

- [ ] **Step 5: Push**

```bash
git push
```

(Push the completed branch to its configured remote per this project's standing git workflow — confirm the branch is already tracking a remote first with `git status`, or `git push -u origin HEAD` if not.)
