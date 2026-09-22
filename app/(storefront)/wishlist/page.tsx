import type { Metadata } from 'next';
import { WishlistView } from '@/components/product/WishlistView';
import { buildPageMetadata } from '@/lib/seo/metadata';

// This page's entire content is personal, client-side, localStorage-derived
// state (ROADMAP.md Phase 10's anonymous-local wishlist) with nothing
// universal to rank for — the same reasoning that makes Bag/Cart pages
// universally noindex'd on real commerce sites, and directly analogous to
// app/(access)/access/page.tsx's own "UI gate/personal state, not
// indexable content" treatment. `robots: { index: false, follow: false }`
// mirrors that exact precedent (spread over buildPageMetadata's usual
// shape rather than a bespoke Metadata object, so this route still gets
// the same title/description/canonical/openGraph fields every other real
// route gets). Deliberately not added to app/sitemap.ts — a noindexed page
// has no business in a sitemap — and proxy.ts needs no change: this route
// is gated by the access cookie exactly like /contact and /legal/* already
// are (DECISIONS.md D-054), which is a proxy.ts matcher property this
// route inherits automatically by living under app/(storefront)/**.
export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Wishlist — Esque',
    description: 'Products saved to your Esque wishlist.',
    path: '/wishlist',
  }),
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:px-8">
      <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
        Wishlist
      </h1>
      <WishlistView />
    </div>
  );
}
