import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftNotice } from '@/components/legal/DraftNotice';
import { Placeholder } from '@/components/legal/Placeholder';
import { PolicySection } from '@/components/legal/PolicySection';
import { buildPageMetadata } from '@/lib/seo/metadata';

// DRAFT content — see DECISIONS.md D-054. Shipping carrier, rates, and
// timelines are unresolved per PROJECT.md §54/§101 — this page states the
// one real, decided fact (U.S.-only, no restocking) and marks everything
// else dependent on the carrier/logistics decision as a placeholder,
// rather than inventing a plausible-sounding rate or timeframe.
export const metadata: Metadata = buildPageMetadata({
  title: 'Shipping Policy — Esque',
  description:
    "Where Esque ships and how shipping works. This policy is a draft pending Esque's final shipping carrier and rates.",
  path: '/legal/shipping',
});

export default function ShippingPolicyPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
          Shipping Policy
        </h1>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          Draft prepared September 2026
        </p>
      </header>

      <DraftNotice />

      <PolicySection title="Where We Ship">
        <p>
          Collection 001 ships within the United States only. Esque does not currently offer
          international shipping.
        </p>
      </PolicySection>

      <PolicySection title="Carriers &amp; Methods">
        <p>
          <Placeholder>
            Esque&apos;s shipping carrier(s) and available service levels have not yet been
            finalized
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Shipping Rates">
        <p>
          <Placeholder>
            shipping rates, and whether a free-shipping threshold will be offered, have not yet been
            finalized
          </Placeholder>
          . Any rate that applies to your order will be shown at checkout before you pay.
        </p>
      </PolicySection>

      <PolicySection title="Order Processing Time">
        <p>
          <Placeholder>
            typical order processing time before an order ships has not yet been finalized
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Estimated Delivery Times">
        <p>
          <Placeholder>estimated delivery timeframes have not yet been finalized</Placeholder>.
        </p>
      </PolicySection>

      <PolicySection title="Order Tracking">
        <p>
          Esque intends to provide tracking information once an order ships.{' '}
          <Placeholder>
            the specific tracking mechanism depends on the carrier Esque selects
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Shipping Address Accuracy">
        <p>
          You are responsible for providing a complete and accurate shipping address at checkout.
          Esque is not responsible for orders delayed or lost because of an incorrect address
          provided at checkout.
        </p>
      </PolicySection>

      <PolicySection title="Lost, Delayed, or Damaged Shipments">
        <p>
          If your order arrives damaged, or does not arrive within the expected delivery window,
          contact Esque and we will work with you and the carrier to resolve it.{' '}
          <Placeholder>the specific claims process has not yet been finalized</Placeholder>.
        </p>
      </PolicySection>

      <PolicySection title="Limited-Drop Availability">
        <p>
          Because Esque sells in limited quantities per collection, a shipping delay does not extend
          or guarantee restock of a sold-out item — sold-out products from a drop are not
          replenished during that drop.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          Shipping questions can be directed to Esque through{' '}
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
