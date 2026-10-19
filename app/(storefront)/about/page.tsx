import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbJsonLd } from '@/lib/seo/structured-data';

// PROJECT.md §90's Initial Sitemap lists About as its own top-level entry.
// lib/navigation-data.ts's NAVIGATION has listed { label: 'ABOUT', href:
// '/about' } since this project's earliest scaffolding, and FullScreenMenu.tsx
// renders every NAVIGATION entry unconditionally — meaning the main menu's
// ABOUT link has been live, and 404ing, since before this file existed. This
// closes that gap, matching D-067/D-069's identical "already-exposed broken
// link" framing for COLLECTIONS before it was built.
//
// Deliberately NOT a DraftNotice/Placeholder page (components/legal/*, see
// DECISIONS.md D-054). Those exist for content blocked on an unresolved
// *business/legal* decision pending counsel review (shipping rates, return
// windows, governing jurisdiction) — there is no such decision here. PROJECT.md
// §60 states plainly that About's content is deferred by product decision, not
// blocked on a fact nobody has settled yet, and §92 names "expanded About
// editorial" (the full brand story, campaign content) as intentionally
// deferred to V2+. That is the same kind of gap DESIGN_SYSTEM.md §65's
// placeholder convention already covers elsewhere — a creative asset or
// editorial decision that doesn't exist yet (CollectionHero's campaign
// imagery/statement, the full Interactive Model experience) — so this page
// follows that convention instead: real foundational content where real,
// decided content exists (PROJECT.md §1's brand definition, lightly
// reformatted to CONTENT.md's voice/case rules, not fabricated), and a small,
// muted, honest closing note — reusing InteractiveModelPlaceholder.tsx's exact
// "ARRIVING SOON." copy verbatim, the same precedented phrase for "this
// experience isn't fully built yet" — rather than inventing new marketing
// copy or a brand story PROJECT.md hasn't written.
export const metadata: Metadata = buildPageMetadata({
  title: 'About — Esque',
  description:
    'Esque is a niche, experimental fashion house built around limited drops — and where the name comes from.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 md:px-8">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
          About
        </h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
          The Name
        </h2>
        {/* PROJECT.md §1, lightly reformatted (CONTENT.md §1: concise,
            restrained, no long explanations) — not new copy. */}
        <p className="text-body text-esque-text">
          Esque comes from the suffix meaning &quot;like,&quot; &quot;resembling,&quot; or &quot;in
          the style or manner of.&quot; It&apos;s a name built to explore different aesthetics,
          styles, and creative identities — while remaining recognizably Esque.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
          The Drops
        </h2>
        {/* PROJECT.md §1/§7's drop model — already real, shipped behavior
            (Collection 001, the Archive), not speculative. */}
        <p className="text-body text-esque-text">
          Esque is a niche, experimental fashion house built around limited clothing drops rather
          than a permanent catalog. Each collection runs its course, then moves to the Archive to
          make room for the next.
        </p>
      </section>

      {/* DESIGN_SYSTEM.md §65 / InteractiveModelPlaceholder.tsx's established
          convention for a creative/editorial experience that doesn't exist
          yet: a small, muted, uppercase label plus a plain closing heading —
          not DraftNotice/Placeholder (see file header). "ARRIVING SOON." is
          reused verbatim, the same already-approved phrase, not new copy. */}
      <section className="flex flex-col gap-2 border-t border-esque-surface pt-8">
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          EXPANDED ABOUT EDITORIAL
        </p>
        <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
          ARRIVING SOON.
        </h2>
      </section>
    </div>
  );
}
