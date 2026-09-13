// Single source of truth for the six legal/policy routes under /legal/*.
// Footer.tsx and app/sitemap.ts both need this exact list — deriving both
// from one array (rather than two hand-maintained link lists) avoids the
// kind of silent drift DECISIONS.md D-023/D-053 already guard against
// elsewhere in this codebase (taxonomy derived from NAVIGATION; the
// sitemap derived from NAVIGATION's own category list).
//
// Contact (/contact) is deliberately NOT in this list — it's a support
// page, not a legal/policy document (see Footer's own
// aria-label="Legal and support", which has always named these as two
// related-but-distinct groups). Callers that need "every footer link"
// add '/contact' alongside this list rather than folding it in here.

export interface LegalPage {
  /** URL path segment under /legal/, e.g. 'privacy'. */
  slug: string;
  /** Full route path, e.g. '/legal/privacy'. */
  href: string;
  /** Display label, e.g. 'Privacy Policy'. */
  label: string;
}

export const LEGAL_PAGES: LegalPage[] = [
  { slug: 'privacy', href: '/legal/privacy', label: 'Privacy Policy' },
  { slug: 'terms', href: '/legal/terms', label: 'Terms of Service' },
  { slug: 'shipping', href: '/legal/shipping', label: 'Shipping Policy' },
  { slug: 'returns', href: '/legal/returns', label: 'Return Policy' },
  { slug: 'refunds', href: '/legal/refunds', label: 'Refund Policy' },
  { slug: 'accessibility', href: '/legal/accessibility', label: 'Accessibility Statement' },
];
