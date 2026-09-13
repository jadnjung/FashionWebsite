import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftNotice } from '@/components/legal/DraftNotice';
import { Placeholder } from '@/components/legal/Placeholder';
import { PolicySection } from '@/components/legal/PolicySection';
import { buildPageMetadata } from '@/lib/seo/metadata';

// DRAFT content — see DECISIONS.md D-054. Return window length and
// exchange availability are unresolved per PROJECT.md §101 — marked as
// placeholders rather than an invented number. "Contact us to start a
// return" is a real, decided fact: PROJECT.md §86 commits to email-only
// support with no self-service return portal built or planned for V1.
export const metadata: Metadata = buildPageMetadata({
  title: 'Return Policy — Esque',
  description:
    "How returns work at Esque. This policy is a draft pending Esque's final return window.",
  path: '/legal/returns',
});

export default function ReturnPolicyPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
          Return Policy
        </h1>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          Draft prepared September 2026
        </p>
      </header>

      <DraftNotice />

      <PolicySection title="Return Eligibility Window">
        <p>
          <Placeholder>
            the number of days you have to return an item, counted from delivery, has not yet been
            finalized
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Condition Requirements">
        <p>
          To be eligible for a return, an item must be unworn, unwashed, and undamaged, with its
          original tags and packaging.
        </p>
      </PolicySection>

      <PolicySection title="Non-Returnable Items">
        <p>
          <Placeholder>
            whether any Collection 001 items will be marked final sale has not yet been decided
          </Placeholder>
          . Any item excluded from returns will be clearly marked as final sale on its product page
          before you buy it.
        </p>
      </PolicySection>

      <PolicySection title="How to Start a Return">
        <p>
          Contact Esque through{' '}
          <Link
            href="/contact"
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            Contact
          </Link>{' '}
          with your order number and the item you&apos;d like to return.{' '}
          <Placeholder>
            the specific instructions we&apos;ll send back (packaging, label, drop-off) have not yet
            been finalized
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Return Shipping Costs">
        <p>
          <Placeholder>
            who covers the cost of return shipping has not yet been finalized, except that Esque
            covers it when the return is the result of Esque&apos;s error
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Exchanges">
        <p>
          <Placeholder>
            whether Esque will offer direct exchanges (for a different size, for example) has not
            yet been decided
          </Placeholder>
          . In the meantime, a return followed by a new order is the way to change size or color
          while stock lasts.
        </p>
      </PolicySection>

      <PolicySection title="Returns From Archived Collections">
        <p>
          Once a collection is archived, items from it remain eligible for return under the same
          window, measured from your original delivery date — archiving a collection does not
          shorten your return window.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          Return questions can be directed to Esque through{' '}
          <Link
            href="/contact"
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            Contact
          </Link>
          .
        </p>
      </PolicySection>
    </article>
  );
}
