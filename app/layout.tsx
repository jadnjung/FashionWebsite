import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
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

// Neither is provisioned in this environment (no real GA4 property or
// Search Console verification exists yet — matches .env.local.example's
// established placeholder pattern, D-020's Klaviyo precedent). Read once,
// at module scope, so both the metadata export and the JSX below agree.
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

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
  // Google Search Console site-verification meta tag
  // (<meta name="google-site-verification" content="...">) — Next's own
  // documented mechanism for this (confirmed directly against this
  // project's installed Next 16.3.1 type definitions), gated the same way
  // as every other not-yet-provisioned value in this codebase. This is
  // genuinely all the application code Search Console needs; the DNS/HTML-
  // file verification alternatives remain pure account-setup, no code
  // either way. See DECISIONS.md D-055.
  verification: GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : undefined,
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
      {/* @next/third-parties's GoogleAnalytics — the current, official
          Next.js-recommended mechanism for loading GA4's gtag.js (confirmed
          against this exact installed Next 16.3.1 version's own bundled
          docs, not assumed). Loads after hydration (its own next/script
          default strategy, "afterInteractive") so it never competes with
          initial paint — ARCHITECTURE.md's/CLAUDE.md's third-party-script
          performance guidance. Rendered on every route (including
          `/access`, outside the storefront shell) since Access Funnel page
          views are real analytics targets too. Entirely absent from the
          rendered output — not just inert — when unconfigured, matching
          this project's established placeholder-env-var pattern (D-020).
          See DECISIONS.md D-055. */}
      {GA4_MEASUREMENT_ID && <GoogleAnalytics gaId={GA4_MEASUREMENT_ID} />}
    </html>
  );
}
