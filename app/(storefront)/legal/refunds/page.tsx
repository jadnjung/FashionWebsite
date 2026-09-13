import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftNotice } from '@/components/legal/DraftNotice';
import { Placeholder } from '@/components/legal/Placeholder';
import { PolicySection } from '@/components/legal/PolicySection';
import { buildPageMetadata } from '@/lib/seo/metadata';

// DRAFT content — see DECISIONS.md D-054. Refund timing/shipping-cost
// treatment are unresolved per PROJECT.md §101 — marked as placeholders.
// "Refunds return to the original payment method via Shopify" is a real,
// decided fact (PROJECT.md §50: Shopify manages refunds).
export const metadata: Metadata = buildPageMetadata({
  title: 'Refund Policy — Esque',
  description:
    "How refunds work at Esque once a return is received. This policy is a draft pending Esque's final refund timing.",
  path: '/legal/refunds',
});

export default function RefundPolicyPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
          Refund Policy
        </h1>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          Draft prepared September 2026
        </p>
      </header>

      <DraftNotice />

      <PolicySection title="Refund Method">
        <p>
          Approved refunds are issued to your original payment method through Shopify, which
          processes Esque&apos;s payments.
        </p>
      </PolicySection>

      <PolicySection title="Refund Timing">
        <p>
          Refund processing begins once your return is received and inspected.{' '}
          <Placeholder>
            typical turnaround time, and how long it takes your bank or card issuer to post the
            refund, has not yet been finalized
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Partial Refunds">
        <p>
          A partial refund may apply if a returned item shows signs of wear, is missing its original
          tags, or otherwise does not meet the condition described in the{' '}
          <Link
            href="/legal/returns"
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            Return Policy
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="Shipping Cost Refunds">
        <p>
          <Placeholder>
            whether original shipping charges are refundable has not yet been finalized, except that
            Esque refunds them when the return is the result of Esque&apos;s error
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Store Credit">
        <p>
          Esque does not currently offer store credit. Refunds are issued to your original payment
          method. This section will be updated if store credit is introduced.
        </p>
      </PolicySection>

      <PolicySection title="Reviewing Returned Items">
        <p>
          Esque inspects returned items against the{' '}
          <Link
            href="/legal/returns"
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            Return Policy
          </Link>{' '}
          before approving a refund, and will contact you if an item does not qualify.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          Refund questions can be directed to Esque through{' '}
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
