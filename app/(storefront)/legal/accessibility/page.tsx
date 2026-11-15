import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicySection } from '@/components/legal/PolicySection';
import { buildPageMetadata } from '@/lib/seo/metadata';

// Unlike the other five /legal/* pages, this is real, present-tense
// content rather than a DraftNotice-flagged draft — see DECISIONS.md
// D-054. It describes work that has actually been done and verified
// (DECISIONS.md D-010, D-014, D-021, D-037, D-042, D-043, D-047 through
// D-051), not a policy waiting on an unresolved business decision. The
// "conformance status" framing below (targeting, not certifying, full
// conformance) is standard, honest practice for a real accessibility
// statement, and mirrors this project's own documented caveats (D-051:
// testing to date has been Chromium-focused and is not an exhaustive
// audit of every WCAG 2.2 AA success criterion) rather than overclaiming.
export const metadata: Metadata = buildPageMetadata({
  title: 'Accessibility Statement — Esque',
  description:
    "Esque's commitment to an accessible shopping experience, current status, and how to report a barrier.",
  path: '/legal/accessibility',
});

export default function AccessibilityStatementPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
          Accessibility Statement
        </h1>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          Technical description updated November 2026
        </p>
      </header>

      <PolicySection title="Our Commitment">
        <p>
          Esque is designed to be usable by as many people as possible, including people who
          navigate by keyboard, use a screen reader, or rely on reduced-motion settings.
          Accessibility is treated as a product requirement, not an optional cleanup step — equally
          true for an experimental, editorial-first fashion site as for any conventional store.
        </p>
      </PolicySection>

      <PolicySection title="Conformance Status">
        <p>
          Esque targets conformance with the Web Content Accessibility Guidelines (WCAG) 2.2, Level
          AA. Significant parts of the site have been evaluated against this standard, including
          keyboard operability, screen reader labeling and announcements, color contrast, and
          support for reduced-motion preferences. This is not yet a complete, exhaustive audit
          against every WCAG 2.2 AA success criterion, and testing to date has been conducted
          primarily in Chromium-based browsers.
        </p>
      </PolicySection>

      <PolicySection title="What We've Done">
        <ul className="list-disc pl-5">
          <li>
            Shopping controls are designed for keyboard operation and are checked in browser
            journeys.
          </li>
          <li>Visible focus indicators are provided and checked during interface review.</li>
          <li>
            Text and interface colors are checked against WCAG&apos;s minimum contrast ratios.
          </li>
          <li>
            The site respects your operating system&apos;s reduced-motion setting, and never
            requires animation to browse, select a size, or complete a purchase.
          </li>
          <li>
            Content that updates without a page change — such as product selection in the collection
            closet or a price updating after you choose a size — is announced to screen readers.
          </li>
          <li>Form fields describe what&apos;s required and announce validation errors.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Known Limitations">
        <p>
          Automated browser checks cover selected shopping journeys and responsive layouts. Complete
          screen-reader speech verification, physical-device testing, and an exhaustive WCAG review
          remain in progress. Please report any barrier you encounter.
        </p>
      </PolicySection>

      <PolicySection title="Ongoing Work">
        <p>
          Accessibility is an ongoing commitment. As new features ship, we evaluate them against the
          same standard rather than treating this as a one-time fix.
        </p>
      </PolicySection>

      <PolicySection title="Feedback">
        <p>
          If you encounter an accessibility barrier anywhere on the Esque site, please tell us —
          include the page and a short description of what happened. Contact Esque through{' '}
          <Link
            href="/contact"
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            Contact
          </Link>
          . We&apos;ll make a reasonable effort to address it.
        </p>
      </PolicySection>
    </article>
  );
}
