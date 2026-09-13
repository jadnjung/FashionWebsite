import type { Metadata } from 'next';
import { functionalFont, displayFont } from '@/lib/fonts';
import {
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo/site';
import './globals.css';

// metadataBase resolves every relative URL-based metadata field (canonical,
// openGraph.url, sitemap/robots' own absolute URLs read SITE_URL directly)
// across the whole app — required once any page declares one of those
// fields with a relative path (Next.js docs: a relative URL-based field
// without metadataBase set is a build error). This is the only page/layout
// in the tree that doesn't go through lib/seo/metadata.ts's
// buildPageMetadata (the homepage has no page.tsx metadata override — its
// title/description/canonical/openGraph below double as '/'s own real
// metadata, not just a fallback default for pages that forget to set one).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: 'Esque — a niche, experimental fashion house.',
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE_NAME,
    description: 'Esque — a niche, experimental fashion house.',
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
    // Explicit, not relied-on-via-file-convention-inheritance, for the
    // same reason lib/seo/metadata.ts's buildPageMetadata does this — see
    // its comment and lib/seo/site.ts's OG_IMAGE_* constants.
    images: [
      { url: OG_IMAGE_PATH, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: OG_IMAGE_ALT },
    ],
  },
};

// Typed explicitly rather than via the generated `LayoutProps<'/'>` global:
// that type only exists in `.next/types/` after a build, so `pnpm typecheck`
// on a fresh checkout (as CI does, before `pnpm build`) would fail to resolve it.
export default function RootLayout({ children }: { children: React.ReactNode }) {
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
