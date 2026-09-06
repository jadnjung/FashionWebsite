import Link from 'next/link';
import { getCategoryLabel, type CategorySlug } from '@/lib/catalog/taxonomy';

const CATEGORIES: CategorySlug[] = ['tops', 'bottoms', 'etc'];

// DESIGN_SYSTEM.md §34 — large-typography category navigator. Labels come
// from lib/catalog/taxonomy.ts's getCategoryLabel — the same NAVIGATION-
// derived single source of truth Header/FullScreenMenu/category pages
// already use (D-023), not a fourth parallel label list. Links to the
// real Phase 4 category routes. No imagery-on-hover (DESIGN_SYSTEM.md's
// fuller vision) — no real category photography exists yet (PROJECT.md
// §101); the hover treatment that IS built (a color shift, reusing
// FullScreenMenu's exact hover:text-esque-forest treatment) needs no
// photography and is fully real.
export function CategoryShowcase() {
  return (
    <section
      aria-label="Shop by Category"
      className="flex min-h-[70svh] flex-col items-center justify-center gap-2 bg-esque-black py-16"
    >
      {/* Visually hidden: the giant category words below already
          communicate "shop by category" to sighted users, so a visible
          duplicate heading would only add clutter. Kept for screen-reader
          heading-navigation and a consistent one-h2-per-scene outline —
          matching FullScreenMenu's own precedent of plain, non-heading-
          wrapped links for this exact kind of giant-typography nav. */}
      <h2 className="sr-only">Shop by Category</h2>
      {CATEGORIES.map((category) => (
        <Link
          key={category}
          href={`/${category}`}
          className="font-display text-display-l uppercase leading-none tracking-display text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          {getCategoryLabel(category)}
        </Link>
      ))}
    </section>
  );
}
