import type { Metadata } from 'next';
import { PolicySection } from '@/components/legal/PolicySection';
import { buildPageMetadata } from '@/lib/seo/metadata';

// Real contact mechanism — a mailto: link to Esque's support email, backed
// by an environment variable rather than a hardcoded address (see
// DECISIONS.md D-054). No business email has been provisioned yet
// (PROJECT.md §96 lists a professional support address as recommended but
// not yet set up — no domain is registered, per PROJECT.md §101 — and
// .env.local.example has no such variable until this change). Hardcoding a
// plausible-looking address here would be exactly the "fabricated contact
// details" this task's own brief warns against. Until
// NEXT_PUBLIC_SUPPORT_EMAIL is configured, the page shows the same "ESQUE
// PLACEHOLDER" treatment DESIGN_SYSTEM.md §65 already establishes sitewide
// for undecided content (SizeGuidePanel's measurements, the homepage
// Hero's campaign image) — consistent, and impossible to mistake for a
// live, monitored address. Not NEXT_PUBLIC_-gated for any technical reason
// (this page is a Server Component and never needs the value client-side)
// — the prefix is kept purely to match this codebase's existing semantic
// convention of using it for public, non-secret site identity values
// (lib/seo/site.ts's SITE_URL), distinct from the unprefixed secrets
// (KLAVIYO_PRIVATE_API_KEY, ESQUE_ACCESS_PASSWORD) in the same file.
//
// A form was considered and rejected: no email-sending backend exists in
// this codebase (no app/api/ route handlers), so a form with nowhere real
// to submit to would be UI theater — worse than an honest mailto: link,
// which needs no backend at all.
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact — Esque',
  description: 'Reach Esque support for order, shipping, return, and product questions.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
          Contact
        </h1>
        <p className="text-body text-esque-text">Esque support is available by email.</p>
      </header>

      <PolicySection title="We Can Help With">
        <ul className="list-disc pl-5">
          <li>Order support</li>
          <li>Shipping questions</li>
          <li>Returns</li>
          <li>Product questions</li>
        </ul>
      </PolicySection>

      <PolicySection title="Email">
        {SUPPORT_EMAIL ? (
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            {SUPPORT_EMAIL}
          </a>
        ) : (
          <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
            ESQUE PLACEHOLDER — SUPPORT EMAIL
          </p>
        )}
        <p className="text-esque-text-secondary">
          We read every message and reply as quickly as we can.
        </p>
      </PolicySection>
    </div>
  );
}
