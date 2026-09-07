/**
 * Builds a CSS view-transition-name (React's `<ViewTransition name=...>`
 * prop) for a product's shared-element image — DECISIONS.md D-038. Shared
 * by ProductCard (the grid/source side), ProductGallery (the PDP
 * destination), and SilhouetteIllustration (the Interactive Model's own
 * source, see DECISIONS.md D-039), so every pairing agrees byte-for-byte
 * from one source of truth rather than three independently-built strings
 * that could drift.
 *
 * A CSS `<custom-ident>` forbids characters outside a fairly permissive
 * set, but Shopify's own handle format is not contractually guaranteed to
 * be CSS-safe (PROJECT.md §101 lists product data as still open) — this
 * defensively maps anything outside `[a-zA-Z0-9-_]` to a hyphen rather than
 * assuming every possible handle is already safe, and prefixes with a
 * namespace so this can never collide with an unrelated named
 * view-transition elsewhere on the page (e.g. a future persistent-element
 * name like "site-header").
 */
export function getProductViewTransitionName(handle: string): string {
  const safe = handle.replace(/[^a-zA-Z0-9-_]/g, '-');
  return `esque-product-${safe}`;
}
