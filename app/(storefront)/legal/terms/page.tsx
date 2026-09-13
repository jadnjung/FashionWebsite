import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftNotice } from '@/components/legal/DraftNotice';
import { Placeholder } from '@/components/legal/Placeholder';
import { PolicySection } from '@/components/legal/PolicySection';
import { buildPageMetadata } from '@/lib/seo/metadata';

// DRAFT content — see DECISIONS.md D-054.
export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Service — Esque',
  description:
    "The terms governing use of the Esque website and purchases from Esque. This policy is a draft pending review by Esque's legal counsel.",
  path: '/legal/terms',
});

export default function TermsOfServicePage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
          Terms of Service
        </h1>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          Draft prepared September 2026
        </p>
      </header>

      <DraftNotice />

      <PolicySection title="Acceptance of Terms">
        <p>
          By using esque.com or purchasing from Esque, you agree to these terms. If you do not
          agree, please do not use the site.
        </p>
      </PolicySection>

      <PolicySection title="Eligibility">
        <p>
          You must be able to form a binding contract to place an order with Esque.{' '}
          <Placeholder>
            the minimum age to transact has not yet been confirmed with counsel — Esque&apos;s
            audience includes visitors under 18, which the final terms will need to address directly
            (for example, requiring a parent or guardian to complete a purchase on a minor&apos;s
            behalf)
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Products, Pricing &amp; Availability">
        <p>
          Esque sells clothing in limited quantities as part of numbered collection drops. Products
          remain purchasable while inventory exists; once a product sells out, it stays visible on
          the site but is not restocked within that drop. Prices and availability are subject to
          change without notice, and Esque may correct pricing or listing errors, including after an
          order is placed.
        </p>
      </PolicySection>

      <PolicySection title="Orders &amp; Acceptance">
        <p>
          An order is an offer to purchase, which Esque may accept or decline. Esque may cancel or
          limit any order — for example, in cases of suspected fraud, a pricing or inventory error,
          or a violation of these terms — and will refund any payment already collected for a
          cancelled order.
        </p>
      </PolicySection>

      <PolicySection title="Payment">
        <p>
          Orders are processed through Shopify Checkout. Esque plans to accept major credit and
          debit cards, Apple Pay, Shop Pay, and — where enabled — PayPal and Google Pay. Esque does
          not accept cryptocurrency. You represent that any payment method you use is your own or
          that you are authorized to use it.
        </p>
      </PolicySection>

      <PolicySection title="Access to the Site">
        <p>
          Parts of the Esque website may require an access code as part of the Esque experience.
          Access codes are personal to the recipient and may not be resold or redistributed. This
          does not affect the availability of Esque&apos;s product and collection pages to visitors
          arriving from search engines.
        </p>
      </PolicySection>

      <PolicySection title="Shipping">
        <p>
          Collection 001 ships within the United States only; Esque does not currently offer
          international shipping. See the{' '}
          <Link
            href="/legal/shipping"
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            Shipping Policy
          </Link>{' '}
          for carrier, rate, and timing details.
        </p>
      </PolicySection>

      <PolicySection title="Returns &amp; Refunds">
        <p>
          See the{' '}
          <Link
            href="/legal/returns"
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            Return Policy
          </Link>{' '}
          and{' '}
          <Link
            href="/legal/refunds"
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            Refund Policy
          </Link>{' '}
          for how returns and refunds are handled.
        </p>
      </PolicySection>

      <PolicySection title="Intellectual Property">
        <p>
          The Esque name, logo, photography, and site design belong to Esque and may not be used
          without permission. Purchasing a product gives you the product itself, not a license to
          Esque&apos;s brand or content.
        </p>
      </PolicySection>

      <PolicySection title="User Conduct">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5">
          <li>Use automated tools (bots) to browse, monitor, or purchase from the site.</li>
          <li>
            Attempt to circumvent inventory or per-order quantity limits, including through multiple
            accounts.
          </li>
          <li>Copy, scrape, or resell Esque&apos;s content or product listings.</li>
          <li>Interfere with the site&apos;s security or normal operation.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Accounts">
        <p>
          Creating an Esque account is optional. If you create one, you are responsible for keeping
          your login credentials secure and for activity that occurs under your account.
        </p>
      </PolicySection>

      <PolicySection title="Disclaimers &amp; Limitation of Liability">
        <p>
          The site and its content are provided &quot;as is&quot; without warranties of any kind, to
          the extent permitted by law.{' '}
          <Placeholder>
            the specific limitation-of-liability language for this jurisdiction has not yet been
            finalized with counsel
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="Governing Law">
        <p>
          <Placeholder>
            the state law that governs these terms, and where disputes will be resolved, has not yet
            been determined
          </Placeholder>
          .
        </p>
      </PolicySection>

      <PolicySection title="General">
        <p>
          If any part of these terms is found unenforceable, the rest remains in effect. These
          terms, together with the other Esque policies linked above, are the entire agreement
          between you and Esque regarding use of the site. Esque may update these terms from time to
          time; material changes will be reflected by updating the draft date at the top of this
          page.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          Questions about these terms can be directed to Esque through{' '}
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
