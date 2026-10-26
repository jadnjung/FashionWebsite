'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useEffectEvent, useMemo, useRef, useState, type RefObject } from 'react';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Button } from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics/gtag';
import { searchCategories } from '@/lib/catalog/taxonomy';
import { getCollectionHref } from '@/lib/collections/drop-phase';
import type { CollectionSummary } from '@/lib/shopify/collections';
import type { ProductListItem } from '@/lib/shopify/products';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  // The SEARCH button in Header, so focus can be returned to it explicitly
  // on close — mirrors FullScreenMenu's triggerRef exactly (see its own
  // comment for why this must be explicit rather than inferred from
  // document.activeElement on WebKit).
  triggerRef: RefObject<HTMLButtonElement | null>;
}

// DESIGN_SYSTEM.md §50 — "feel instantaneous": a one-character query isn't
// yet a real search attempt (no fetch fires, no result sections render at
// all), and 2+ characters searches immediately. A judgment call in the
// same spirit as D-028's scarcity thresholds — the spec doesn't pin an
// exact number, so one is chosen and recorded rather than left implicit.
const MIN_QUERY_LENGTH = 2;
// INTERACTIONS.md §3's "Standard UI" tier is 200-350ms for this exact
// class of interaction ("filter, menu item, quick add"); 200ms is the
// tier's fast end, chosen because DESIGN_SYSTEM.md §50 specifically calls
// for search to "feel instantaneous" — a stronger framing than ordinary UI
// transitions.
const DEBOUNCE_MS = 200;

// Products and collections arrive together from one /api/search response
// (one fetch, one loading lifecycle) — the loaded variant carries both
// rather than tracking a second, separately-fetched state variable that
// would just mirror this same lifecycle a second time (two sources of
// truth for one state transition). Renamed from the original
// products-only ProductsState now that this state also carries the
// COLLECTIONS result group (DECISIONS.md D-058 Part 3's original
// deferral, resolved — see D-069).
type SearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; products: ProductListItem[]; collections: CollectionSummary[] };

// DESIGN_SYSTEM.md §50 — full-screen predictive search overlay, triggered
// by Header's SEARCH button. Resolves DECISIONS.md D-025's deferral: see
// the design spec (docs/superpowers/specs/2026-09-18-search-design.md) for
// the full architecture. The COLLECTIONS result group, originally deferred
// here (D-058 Part 3), is now built (D-069) — a dedicated results page and
// enableSharedTransition remain deliberately not built, for the reasons
// D-058 already recorded.
//
// Reuses FullScreenMenu.tsx's exact, already-reviewed accessibility
// mechanics (role="dialog" + aria-modal, the hasOpenedRef-gated open/close
// effect, the useEffectEvent-based pathname-close effect, the hand-rolled
// Tab-cycle focus trap + Escape-to-close) rather than reinventing them —
// see that file for the full reasoning behind each. The one deliberate
// addition beyond FullScreenMenu's own pattern is a real, visible CLOSE
// button: FullScreenMenu never needed one because every visible thing in
// it is a navigable link (clicking any category both navigates and
// closes), but Search's primary content is an input plus result sections
// that can be empty, loading, or erroring — there's no guaranteed
// clickable escape route for a mouse/touch user who hasn't discovered
// Escape.
export function SearchOverlay({ open, onClose, triggerRef }: SearchOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Same purpose/reasoning as FullScreenMenu's hasOpenedRef — see that
  // file's own comment (React Strict Mode's double-invoked mount effect is
  // why a naive "first render" guard isn't sufficient).
  const hasOpenedRef = useRef(false);
  const pathname = usePathname();

  const [query, setQuery] = useState('');
  const [searchResultsState, setSearchResultsState] = useState<SearchResultsState>({
    status: 'idle',
  });
  // Retry re-runs the debounced product-search effect for the current
  // query without duplicating its fetch logic in a second function —
  // incrementing this is included in that effect's dependency array below.
  const [retryToken, setRetryToken] = useState(0);

  const trimmedQuery = query.trim();
  const isQueryLongEnough = trimmedQuery.length >= MIN_QUERY_LENGTH;

  // CATEGORIES is local, zero-I/O, pure computation (lib/catalog/taxonomy.ts)
  // — genuinely instantaneous, computed synchronously on every render via
  // useMemo (not an effect: there's nothing to derive-in-an-effect here),
  // entirely unaffected by whether Shopify/Demo Mode is configured. Appears
  // a beat ahead of PRODUCTS, which is debounced/network-backed below —
  // the free, local part of the answer shouldn't wait on the network-backed
  // part.
  const categoryResults = useMemo(
    () => (isQueryLongEnough ? searchCategories(trimmedQuery) : []),
    [trimmedQuery, isQueryLongEnough],
  );

  // Always calls the *latest* onClose without needing it in the effect's
  // dependency array below — see FullScreenMenu.tsx's identical comment
  // for why a plain [pathname, onClose] dependency would be wrong here too.
  const handleRouteChange = useEffectEvent(() => {
    onClose();
  });

  useEffect(() => {
    handleRouteChange();
  }, [pathname]);

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      // DESIGN_SYSTEM.md §50: "input receives immediate focus" — the one
      // real difference from FullScreenMenu, which focuses its first link.
      inputRef.current?.focus();
    } else if (hasOpenedRef.current) {
      triggerRef.current?.focus();
      // Reopening always starts fresh, matching this project's few other
      // modal-like surfaces (none persist state across a close/reopen).
      // searchResultsState is reset alongside query — without this, a
      // settled result/error from a *previous*, fully-closed session could
      // flash briefly (until the new debounced fetch overwrites it) the
      // moment a freshly reopened search crosses MIN_QUERY_LENGTH again.
      // This is a real side effect of the close transition (like the
      // focus() call above), not an effect whose only job is mirroring
      // state, so it doesn't reintroduce the react-hooks/set-state-in-effect
      // shape the debounced-fetch effect's own early return avoids below.
      setQuery('');
      setSearchResultsState({ status: 'idle' });
    }
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;

      // Widened to include input:not([disabled]) — unlike FullScreenMenu,
      // this dialog's first focusable element is a text field, not a
      // link/button.
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])',
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

  // The debounced, cancelable products+collections fetch — the only
  // network-backed part of this component. A setTimeout (cleared on every
  // keystroke) wraps a fetch bound to an AbortController, whose cleanup
  // both clears the timer and aborts any in-flight request, so a fast
  // typist never has an earlier, slower response clobber a later, faster
  // one. Closing the overlay (or a query dropping below MIN_QUERY_LENGTH)
  // hits the early return below, which both resets to idle and — via this
  // effect's own cleanup running first — aborts whatever was in flight,
  // with no extra code needed.
  //
  // searchCategories(trimmedQuery) is called again directly inside the
  // resolved-fetch branch below (rather than closing over the render-time
  // categoryResults value or threading it through a ref) purely to compute
  // the settled search event's result_count — it's a pure, synchronous,
  // zero-I/O function of the same trimmedQuery this effect already depends
  // on, so recomputing it here is cheap and correct, and keeps this
  // effect's dependency array exhaustive with no eslint-disable or ref
  // workaround needed.
  useEffect(() => {
    // Nothing to fetch. Deliberately no setState here — react-hooks'
    // set-state-in-effect rule flags a synchronous setState at the top of
    // an effect body as a sign the value should be derived during render
    // instead (see effectiveSearchResultsState below), not synchronized via
    // an effect: `query` is always reset to '' on close (the open/close
    // effect above), so the next time this becomes true `isQueryLongEnough`
    // is already false, and effectiveSearchResultsState masks whatever
    // stale value searchResultsState is still holding — no explicit reset
    // needed.
    if (!open || !isQueryLongEnough) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearchResultsState({ status: 'loading' });
      fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error('search request failed');
          return res.json() as Promise<{
            products: ProductListItem[];
            collections: CollectionSummary[];
          }>;
        })
        .then(({ products, collections }) => {
          setSearchResultsState({ status: 'loaded', products, collections });
          // Discovery: "search queries, no-result searches" (PROJECT.md
          // §82) — DECISIONS.md D-058/D-069. Fired once per settled
          // (debounced, resolved) query, not per keystroke, with
          // result_count equal to exactly what the UI itself treats as
          // "nothing matches" (products + collections + categories), so
          // the analytics signal and the visible empty state can never
          // disagree.
          trackEvent('search', {
            search_term: trimmedQuery,
            result_count:
              products.length + collections.length + searchCategories(trimmedQuery).length,
          });
        })
        .catch(() => {
          // Distinguishes a genuine failure from this request simply
          // having been superseded/aborted (a new keystroke, a close, or
          // this same effect's own cleanup) — an abort is not an error.
          if (controller.signal.aborted) return;
          setSearchResultsState({ status: 'error' });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, trimmedQuery, isQueryLongEnough, retryToken]);

  // Masks a stale searchResultsState value the moment open/isQueryLongEnough
  // goes false, without needing an effect to explicitly reset it (see the
  // comment on the debounced-fetch effect above) — query always resets to
  // '' on close, so the next open naturally starts derived-idle too.
  const effectiveSearchResultsState: SearchResultsState =
    open && isQueryLongEnough ? searchResultsState : { status: 'idle' };

  const showNothingMatches =
    isQueryLongEnough &&
    categoryResults.length === 0 &&
    effectiveSearchResultsState.status === 'loaded' &&
    effectiveSearchResultsState.products.length === 0 &&
    effectiveSearchResultsState.collections.length === 0;

  return (
    <div
      ref={containerRef}
      id="esque-search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      data-open={open}
      className="esque-search-overlay fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-esque-black px-4 py-8 md:px-8 md:py-12"
    >
      <div className="flex justify-end">
        {/* Explicit tabIndex, not left to the button's default: WebKit
            (desktop and iOS Safari) only includes text fields in the Tab
            sequence by default — the system-level "Full Keyboard Access"
            preference (off by default) is what adds links/buttons to it,
            exactly the same quirk FullScreenMenu.tsx's own category links
            already document and fix (confirmed here empirically: without
            this, Shift+Tab from the input on WebKit lands on <body>,
            skipping this button entirely, not the reverse-tab-order bug
            it might look like). */}
        <Button variant="secondary" onClick={onClose} tabIndex={0}>
          CLOSE
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 pt-8">
        <div>
          <label htmlFor="esque-search-input" className="sr-only">
            Search
          </label>
          <input
            id="esque-search-input"
            ref={inputRef}
            type="search"
            autoComplete="off"
            placeholder="SEARCH ESQUE"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border-0 border-b border-esque-text-secondary bg-transparent font-display text-heading-3 uppercase tracking-display text-esque-text placeholder:text-esque-text-secondary focus-visible:border-esque-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text md:text-heading-1"
          />
        </div>

        {isQueryLongEnough && (
          <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-10">
            {categoryResults.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-utility uppercase tracking-metadata text-esque-text-secondary">
                  Categories
                </h2>
                <ul className="flex flex-col gap-3">
                  {categoryResults.map((result) => (
                    <li key={result.href}>
                      {/* Explicit tabIndex — same WebKit default-Tab-
                          sequence quirk as FullScreenMenu.tsx's category
                          links and the CLOSE/Retry buttons above. */}
                      <Link
                        href={result.href}
                        onClick={onClose}
                        tabIndex={0}
                        className="font-display text-heading-3 uppercase tracking-display text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
                      >
                        {result.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Not just `status !== 'idle'` — that rendered this heading
                over empty space once a query settled to zero products
                (status 'loaded', products: []), unlike CATEGORIES/
                COLLECTIONS above/below, which are correctly gated on their
                own `.length > 0`. PRODUCTS can't use that exact same
                one-line gate: unlike those two (pure, synchronous data),
                it has real loading/error sub-states that must still show
                the heading with no products array to check yet. */}
            {(effectiveSearchResultsState.status === 'loading' ||
              effectiveSearchResultsState.status === 'error' ||
              (effectiveSearchResultsState.status === 'loaded' &&
                effectiveSearchResultsState.products.length > 0)) && (
              <div className="flex flex-col gap-4">
                <h2 className="text-utility uppercase tracking-metadata text-esque-text-secondary">
                  Products
                </h2>
                {effectiveSearchResultsState.status === 'loading' && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="aspect-[4/5] animate-pulse bg-esque-surface" />
                    ))}
                  </div>
                )}
                {effectiveSearchResultsState.status === 'error' && (
                  <div className="flex flex-col items-start gap-4">
                    {/* Distinct from app/error.tsx's root-crash copy
                        (CONTENT.md §6 treats "network failure" as its own
                        row, separate from a generic crash) — names what
                        actually failed rather than reusing the identical
                        generic string for two different situations. */}
                    <p className="font-display text-heading-3 uppercase text-esque-text">
                      COULD NOT LOAD RESULTS.
                    </p>
                    {/* tabIndex — same WebKit default-Tab-sequence quirk
                        as the CLOSE button above. */}
                    <Button
                      variant="secondary"
                      onClick={() => setRetryToken((t) => t + 1)}
                      tabIndex={0}
                    >
                      Retry
                    </Button>
                  </div>
                )}
                {effectiveSearchResultsState.status === 'loaded' &&
                  effectiveSearchResultsState.products.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {effectiveSearchResultsState.products.map((product) => (
                        <ProductCard key={product.id} product={product} layout="standard" />
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* DESIGN_SYSTEM.md §50 lists PRODUCTS, CATEGORIES, COLLECTIONS
                in that order; this overlay already renders CATEGORIES before
                PRODUCTS (a pre-existing deviation, not this change's to fix
                — DECISIONS.md D-058/D-069). COLLECTIONS is placed after
                PRODUCTS, preserving the doc's signal that it comes last
                without compounding that existing ordering deviation further.
                Styled exactly like the CATEGORIES group above (same heading
                treatment, same link typography) — plain title text, no
                status badge/phase indicator; that context lives on the
                destination page itself once clicked through. getCollectionHref
                (lib/collections/drop-phase.ts) resolves the correct
                destination for every phase, including routing an archived
                collection to /archive/[handle] instead of the dead
                /collections/[handle] link it would otherwise produce. */}
            {effectiveSearchResultsState.status === 'loaded' &&
              effectiveSearchResultsState.collections.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-utility uppercase tracking-metadata text-esque-text-secondary">
                    Collections
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {effectiveSearchResultsState.collections.map((collection) => (
                      <li key={collection.id}>
                        {/* Explicit tabIndex — same WebKit default-Tab-
                            sequence quirk as the CATEGORIES links above. */}
                        <Link
                          href={getCollectionHref(collection)}
                          onClick={onClose}
                          tabIndex={0}
                          className="font-display text-heading-3 uppercase tracking-display text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
                        >
                          {collection.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {showNothingMatches && (
              <p className="font-display text-heading-3 uppercase text-esque-text">
                NOTHING MATCHES.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
