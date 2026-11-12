import Image from 'next/image';
import Link from 'next/link';
import { ClosetLoader } from '@/components/home/closet/ClosetLoader';
import type { ClosetCollection } from '@/lib/home/closet';

// Demo Mode — see lib/shopify/preview-demo-fixtures.ts's file header and
// DECISIONS.md D-057. Opt-in, off by default.
const PREVIEW_DEMO_MODE = process.env.PREVIEW_DEMO_MODE === '1';

interface CollectionClosetProps {
  collection: ClosetCollection | null;
}

// Homepage Scene 01 (PROJECT.md §23, DESIGN_SYSTEM.md §27) — the current
// collection hanging on a 3D closet rod (DECISIONS.md D-089), replacing the
// earlier static campaign-image hero (D-032) and its pointer parallax
// (D-041).
//
// Three layers, back to front:
//   1. A static poster (the former hero's gradient, or Demo Mode's stand-in
//      photograph). Server-rendered, so it alone decides first paint/LCP,
//      and it is the complete experience whenever the closet can't run —
//      no current collection, no WebGL, a low-performance device.
//   2. The closet itself (ClosetLoader → ClosetExperience), fetched on the
//      client after hydration and faded in over the poster once ready.
//   3. The headline and ENTER COLLECTION link, kept over the closet, which
//      step aside while a garment is pulled out (group-has- below) so the
//      focused piece and its info panel have the stage.
export function CollectionCloset({ collection }: CollectionClosetProps) {
  const hasCloset = collection !== null && collection.products.length > 0;

  return (
    <section
      aria-label="Collection Hero"
      // min-h-[calc(100svh-72px)] — Header.tsx is h-[72px] and in normal
      // document flow (DECISIONS.md D-074/D-077).
      className="group relative flex min-h-[calc(100svh-72px)] flex-col justify-end overflow-hidden bg-esque-black px-4 pb-16 pt-24 md:px-8"
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-linear-to-b from-esque-surface to-esque-black ${hasCloset ? 'opacity-60' : ''}`}
      >
        {PREVIEW_DEMO_MODE ? (
          <>
            <Image
              src="/preview-demo/hero.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className={`object-cover ${hasCloset ? 'opacity-25' : 'opacity-70'}`}
            />
            <div className="absolute inset-0 bg-linear-to-b from-transparent to-esque-black" />
          </>
        ) : (
          !hasCloset && (
            // text-esque-text-secondary — DECISIONS.md D-048 contrast tier.
            <p className="absolute bottom-4 right-4 text-utility uppercase tracking-metadata text-esque-text-secondary">
              ESQUE PLACEHOLDER — CAMPAIGN, HERO
            </p>
          )
        )}
      </div>

      {hasCloset && <ClosetLoader products={collection.products} />}

      {/* Giant atmospheric wordmark — DESIGN_SYSTEM.md §27; the page's one
          semantic h1. Low opacity by design (WCAG 1.4.3 logotype
          exemption; the opaque wordmark is in Header). */}
      <h1 className="pointer-events-none absolute -top-[0.05em] -right-[0.05em] select-none font-display text-display-xl leading-none tracking-display text-esque-text/10">
        ESQUE
      </h1>

      {/* pointer-events-none on the column so the closet behind it stays
          clickable; the link opts back in. `invisible` (not just opacity)
          while a garment is out also takes the link out of the tab order. */}
      <div className="esque-hero-reveal pointer-events-none relative z-10 flex flex-col gap-3 transition-[opacity,visibility] duration-300 ease-esque group-has-data-[closet-selected=true]:invisible group-has-data-[closet-selected=true]:opacity-0">
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          {collection ? collection.title.toUpperCase() : 'COLLECTION 001'}
        </p>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          {PREVIEW_DEMO_MODE
            ? 'AN EXERCISE IN RESTRAINT.'
            : 'ESQUE PLACEHOLDER — CAMPAIGN STATEMENT'}
        </p>
        {/* DESIGN_SYSTEM.md §27's Scene-01 CTA. py-2 meets WCAG 2.5.8. */}
        <Link
          href="/new"
          className="pointer-events-auto w-fit py-2 text-utility uppercase tracking-nav text-esque-text underline-offset-4 transition-colors duration-200 ease-esque hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          ENTER COLLECTION
        </Link>
      </div>
    </section>
  );
}
