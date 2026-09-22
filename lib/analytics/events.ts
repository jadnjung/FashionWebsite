// The documented, closed analytics event taxonomy — CLAUDE.md's Analytics
// section requires "consistent documented event names and properties."
// Defined as code, not just prose, so a typo'd event name is a type error
// (AnalyticsEventName is a closed union) rather than a silent analytics gap,
// and each event's property shape is independently typed so a caller can't
// pass an undeclared field (TypeScript's excess-property check on an object
// literal argument) or omit a required one.
//
// This module has no dependency on the browser or on GA4 itself — see
// lib/analytics/gtag.ts for the thin, browser-only adapter that actually
// sends an event. Splitting it this way mirrors lib/klaviyo/{client,subscribe}.ts:
// client.ts is the raw third-party wiring, subscribe.ts is the validated
// business-rule layer. Here, gtag.ts is the raw wiring and this file is the
// validated layer — and, structurally, mirrors lib/motion/media.ts's
// injected-dependency pattern (an AnalyticsSink parameter instead of
// reaching for `window` directly) so the validation/sanitization logic
// stays fully unit-testable in this project's Node-only vitest environment
// (no jsdom — see lib/product/recently-viewed.ts's header comment).
//
// See DECISIONS.md D-055 for the full design rationale, including why
// `view_item` uses GA4's own standard recommended-event name/shape (a
// genuine, honest match — a real product page genuinely was viewed) while
// `add_to_bag_click`/`quick_add_click` deliberately do NOT use GA4's
// standard `add_to_cart` name: no real cart exists yet (D-016/D-029), and
// firing GA4's own "this item was added to a cart" semantic event for a
// no-op click would misrepresent what happened and contaminate any future
// report once a real add_to_cart event exists alongside it.

/** One line-item for GA4's standard `items` array shape (view_item, add_to_bag_click, quick_add_click). */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
}

// Single source of truth for both the runtime allowlist (isKnownAnalyticsEvent)
// and the compile-time union type (AnalyticsEventName, derived below) — one
// list to maintain, not two that could drift apart.
const ANALYTICS_EVENT_NAMES = [
  // Product Behavior (PROJECT.md §82)
  'view_item',
  'add_to_bag_click',
  'quick_add_open',
  'quick_add_click',
  'variant_selected',
  'add_to_wishlist',
  // Discovery
  'category_nav_click',
  'search',
  // Interactive Experience
  'hotspot_selected',
  'shop_the_look_open',
  // Access Funnel
  'access_gate_view',
  'request_access_open',
  'request_access_attempt',
  'access_granted',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export function isKnownAnalyticsEvent(name: string): name is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(name);
}

// The empty-properties shape for events that carry no data beyond the fact
// that they happened (GA4 still records the standard automatic parameters —
// page_location, page_title, timestamp — for every event regardless).
type NoProperties = Record<string, never>;

interface EventPropertiesMap {
  view_item: {
    currency: string;
    value: number;
    items: [AnalyticsItem];
    // Folds PROJECT.md §82's "sold-out views" into product_view's own
    // payload rather than a second event — a sold-out PDP view is still a
    // product view, just one worth being able to filter/segment by.
    sold_out: boolean;
  };
  add_to_bag_click: {
    currency: string;
    value: number;
    items: [AnalyticsItem];
  };
  // Fires when the on-grid Quick Add trigger (ProductCard) is clicked and
  // the panel begins opening — mirrors the shop_the_look_open/
  // request_access_open "opened a flow" pattern. The Interactive Model's
  // own QUICK ADD button has no separate open step (its panel is already
  // visible once a hotspot is activated), so this event has exactly one
  // real call site today. See DECISIONS.md D-060.
  quick_add_open: {
    item_id: string;
    item_name: string;
  };
  // Fired from two real surfaces: the Interactive Model's own panel
  // (region = hotspot region, e.g. 'top'/'bottom') and the on-grid Quick
  // Add panel (region: 'product_card') — see DECISIONS.md D-060.
  quick_add_click: {
    currency: string;
    value: number;
    items: [AnalyticsItem];
    region: string;
  };
  variant_selected: {
    item_id: string;
    option_name: string;
    option_value: string;
    // Same shared VariantPicker renders on four real, distinct surfaces
    // (DECISIONS.md D-036/D-060) — this distinguishes which one a given
    // selection happened on, since all four are genuine, live interactions
    // today.
    context: 'pdp' | 'interactive_model' | 'shop_the_look' | 'quick_add';
  };
  category_nav_click: {
    category: string;
    href: string;
  };
  // Uses GA4's own standard recommended event name/shape exactly — an
  // honest match (DECISIONS.md D-055's own test), unlike add_to_bag_click's
  // deliberate avoidance of GA4's standard add_to_cart name: a wishlist
  // add is a completely real, fully-functioning action in this pass (a
  // real, persisted local save happens via lib/product/wishlist.ts), so
  // there's no "stub" gap being misrepresented. Identical shape to
  // add_to_bag_click. No corresponding "remove" event exists, deliberately:
  // GA4 has no standard remove_from_wishlist recommended event, PROJECT.md
  // §82 only names "Wishlist adds" (no removal-tracking is named there or
  // anywhere else in this codebase's taxonomy — there is no
  // remove_from_bag event either, even though removing from the Bag is a
  // real, named PROJECT.md §47 action). Considered and deliberately not
  // wired, matching D-055's own "considered and excluded" style.
  add_to_wishlist: {
    currency: string;
    value: number;
    items: [AnalyticsItem];
  };
  // Uses GA4's own standard recommended event exactly where it's an honest
  // match (DECISIONS.md D-055's own test, applied here): a real search
  // genuinely was performed, so the standard name/required search_term
  // param are used rather than invented. result_count folds PROJECT.md
  // §82's "no-result searches" into this event's own payload rather than a
  // second event — the same minimal-modeling choice D-055 made for
  // view_item's sold_out boolean. Fired once per settled (debounced,
  // resolved) query, not per keystroke — see SearchOverlay.tsx.
  search: {
    search_term: string;
    result_count: number;
  };
  hotspot_selected: {
    region: string;
    item_id: string;
    item_name: string;
  };
  shop_the_look_open: NoProperties;
  access_gate_view: NoProperties;
  request_access_open: NoProperties;
  request_access_attempt: NoProperties;
  access_granted: {
    tier: 'general' | 'vip';
  };
}

export type AnalyticsEventProperties<Name extends AnalyticsEventName> = EventPropertiesMap[Name];

// Defense-in-depth beyond the type system: an object literal passed
// directly to trackEvent() already gets TypeScript's excess-property check
// (a stray `email` field on a typed call site is a compile error), but this
// catches a value that reaches here some other way (a spread, an `as`
// cast, a future refactor). Checked case-insensitively; only ever expected
// to actually trigger on a bug, since no property shape above declares any
// of these keys. Shallow (top-level keys only) — deliberately: every
// nested structure here (AnalyticsItem[]) is itself a fully-typed shape
// this module controls, not a bag of arbitrary caller-supplied fields, so a
// deep/recursive scan would be defending against a risk the type system
// already closes off one level down.
const PII_KEY_DENYLIST = new Set([
  'email',
  'password',
  'firstname',
  'lastname',
  'phone',
  'address',
  'consent',
]);

/**
 * Strips any PII-shaped top-level key from `properties` before it's sent
 * anywhere. Returns the same reference untouched (no allocation) when
 * nothing needed stripping — the common case. CLAUDE.md: "avoid
 * unnecessary personal information... no secrets or sensitive customer
 * information in analytics payloads."
 */
export function sanitizeEventProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const deniedKeys = Object.keys(properties).filter((key) =>
    PII_KEY_DENYLIST.has(key.toLowerCase()),
  );
  if (deniedKeys.length === 0) return properties;

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[analytics] Stripped PII-shaped propert${deniedKeys.length === 1 ? 'y' : 'ies'} before sending: ${deniedKeys.join(', ')}`,
    );
  }
  const cleaned = { ...properties };
  for (const key of deniedKeys) delete cleaned[key];
  return cleaned;
}

/** Where a validated event actually gets sent — see lib/analytics/gtag.ts's real implementation. */
export type AnalyticsSink = (eventName: string, properties: Record<string, unknown>) => void;

/**
 * Validates `name` against the closed taxonomy, sanitizes `properties`, and
 * forwards to `sink`. Never throws: an unknown event name is silently
 * dropped (defense in depth — every real call site is already type-checked
 * against AnalyticsEventName, so this should never trigger outside a bug),
 * and a `sink` that throws is swallowed rather than propagated — analytics
 * is fire-and-forget instrumentation and must never break the UI (CLAUDE.md
 * Analytics section; see also DECISIONS.md D-033's precedent for a
 * narrowly-scoped, explicitly-documented exception to "never swallow an
 * error" where the alternative is materially worse).
 */
export function dispatchAnalyticsEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEventProperties<Name>,
  sink: AnalyticsSink,
): void {
  if (!isKnownAnalyticsEvent(name)) return;
  const safeProperties = sanitizeEventProperties(properties);
  try {
    sink(name, safeProperties);
  } catch {
    // Swallowed deliberately — see the docstring above.
  }
}
