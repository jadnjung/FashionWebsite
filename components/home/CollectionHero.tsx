import Link from 'next/link';
import type { CSSProperties } from 'react';
import { HeroParallax } from '@/components/home/HeroParallax';

// Typed helper for the per-layer --depth custom property — CSSProperties
// doesn't declare arbitrary custom properties, so each `style` prop below
// casts through this narrow, local intersection type rather than an
// untyped `as any`, matching SilhouetteIllustration.tsx's existing
// `const style: CSSProperties = {...}` pattern for this same class of
// problem.
type ParallaxLayerStyle = CSSProperties & { '--depth': number };

// DESIGN_SYSTEM.md §27-28, PROJECT.md §23 Scene 01 — full-viewport
// collection hero. Real structure and copy slots; two pieces of content
// are clearly-labeled placeholders per DESIGN_SYSTEM.md §65's convention,
// pending real assets PROJECT.md §101 lists as still open:
//   - collection/campaign imagery — a gradient block stands in for it.
//   - the campaign statement — DESIGN_SYSTEM.md gives no concrete copy for
//     this scene specifically (unlike Scene 03/06), so none is invented.
// Both placeholders are styled exactly like SizeGuidePanel's existing
// "ESQUE PLACEHOLDER — MEASUREMENTS" marker (small, muted, uppercase) —
// deliberately not at display scale, which would read as broken
// production copy rather than an honest, deliberate placeholder.
//
// Cursor-driven depth/parallax between these layers (DESIGN_SYSTEM.md §27,
// INTERACTIONS.md §12) was deferred here to ROADMAP.md Phase 9's own
// "Parallax / depth on homepage scenes" line item (DECISIONS.md D-032) and
// is now implemented via HeroParallax below — see DECISIONS.md D-041.
export function CollectionHero() {
  return (
    <section
      aria-label="Collection Hero"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-esque-black px-4 pb-16 pt-24 md:px-8"
    >
      {/* DESIGN_SYSTEM.md §27 / DECISIONS.md D-032 — cursor-tracked depth
          across these three layers, picked up in ROADMAP.md Phase 9. See
          components/home/HeroParallax.tsx and DECISIONS.md D-041. Each
          layer's own content/copy/aria-hidden treatment is unchanged from
          before this wrapper existed. */}
      <HeroParallax>
        {/* Placeholder campaign imagery — DESIGN_SYSTEM.md §65. Renders
            immediately (no entrance animation) so it can never delay LCP.
            Depth 0.3 — the farthest layer, per DESIGN_SYSTEM §27's
            foreground/background separation (mirrors EntranceMotion's own
            three-tier depth convention for visual consistency). */}
        <div
          aria-hidden="true"
          style={{ '--depth': 0.3 } as ParallaxLayerStyle}
          className="esque-parallax-layer absolute inset-0 bg-linear-to-b from-esque-surface to-esque-black"
        >
          {/* text-esque-text-secondary, not text-esque-text-muted — DECISIONS.md
              D-048: muted fails WCAG AA's 4.5:1 text-contrast minimum at
              this 13px size; secondary is DESIGN_SYSTEM.md's documented
              tier for real descriptive/metadata copy like this. */}
          <p className="absolute bottom-4 right-4 text-utility uppercase tracking-metadata text-esque-text-secondary">
            ESQUE PLACEHOLDER — CAMPAIGN, HERO
          </p>
        </div>

        {/* Giant atmospheric wordmark — DESIGN_SYSTEM.md §27's "Large ESQUE
            typography may exist partially outside the viewport." Doubles as
            the page's one semantic h1 (a homepage's h1 naming the site
            itself is a common, correct pattern). Low opacity by design —
            WCAG 1.4.3 exempts logo/brand-name text from contrast minimums,
            and the fully-opaque "ESQUE" wordmark already exists in Header on
            every page, including this one; a screen reader announces this
            text normally regardless of its visual opacity. Renders at full
            opacity immediately (no entrance animation) so it can never
            delay LCP. Depth 0.6 — the middle "model" layer. */}
        <h1
          style={{ '--depth': 0.6 } as ParallaxLayerStyle}
          className="esque-parallax-layer pointer-events-none absolute -top-[0.05em] -right-[0.05em] select-none font-display text-display-xl leading-none tracking-display text-esque-text/10"
        >
          ESQUE
        </h1>

        {/* Depth 1.0 — the nearest layer (foreground copy/CTA), moves most. */}
        <div
          style={{ '--depth': 1.0 } as ParallaxLayerStyle}
          className="esque-hero-reveal esque-parallax-layer relative flex flex-col gap-3"
        >
          <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
            COLLECTION 001
          </p>
          {/* Campaign statement placeholder — see file header comment.
              text-esque-text-secondary, not text-esque-text-muted — see the
              contrast note on the placeholder label above (DECISIONS.md
              D-048). */}
          <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
            ESQUE PLACEHOLDER — CAMPAIGN STATEMENT
          </p>
          {/* DESIGN_SYSTEM.md §27's own literal Scene-01 content list names
              this CTA "ENTER COLLECTION" (no arrow) — distinct from the
              separate "EXPLORE COLLECTION →" phrase (CONTENT.md §10). Links
              to /new: the closest real, working "current collection"
              destination until /collections/[handle] exists (unbuilt per
              ARCHITECTURE.md §3). Hand-styled to match this codebase's
              established "styled Link, not a wrapped Button" pattern for
              navigational CTAs (see FilterBar's Clear Filters, Footer). */}
          <Link
            href="/new"
            className="w-fit text-utility uppercase tracking-nav text-esque-text underline-offset-4 transition-colors duration-200 ease-esque hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          >
            ENTER COLLECTION
          </Link>
        </div>
      </HeroParallax>
    </section>
  );
}
