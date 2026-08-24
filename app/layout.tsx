import type { Metadata } from 'next';
import { functionalFont, displayFont } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Esque',
  description: 'Esque — a niche, experimental fashion house.',
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
