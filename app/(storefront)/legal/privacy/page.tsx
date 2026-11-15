import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftNotice } from '@/components/legal/DraftNotice';
import { Placeholder } from '@/components/legal/Placeholder';
import { PolicySection } from '@/components/legal/PolicySection';
import { buildPageMetadata } from '@/lib/seo/metadata';

// DRAFT content — see DECISIONS.md D-054. Structurally complete, generic-
// but-accurate boilerplate for a small U.S. apparel e-commerce business,
// citing only real, already-decided facts (Shopify commerce backend,
// Klaviyo email, the access-gate cookie, U.S.-only shipping) and marking
// genuinely open items with <Placeholder>. Not legal advice; requires
// review by counsel against Esque's finalized business operations before
// launch (PROJECT.md §85).
export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy — Esque',
  description:
    "How Esque collects, uses, and shares information. This policy is a draft pending review by Esque's legal counsel.",
  path: '/legal/privacy',
});

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
          Privacy Policy
        </h1>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          Draft prepared September 2026
        </p>
      </header>

      <DraftNotice />

      <PolicySection title="Overview">
        <p>
          This policy explains what information Esque (
          <Placeholder>Esque&apos;s registered business name and address</Placeholder>) collects
          through esque.com, the Request Access form, and — once available — Esque accounts and
          checkout, and how that information is used, shared, and protected.
        </p>
      </PolicySection>

      <PolicySection title="Information We Collect">
        <p>Information you provide directly:</p>
        <ul className="list-disc pl-5">
          <li>Email address, submitted through Request Access.</li>
          <li>Marketing consent, recorded when you check the Request Access consent box.</li>
          <li>If you contact support: your email address and the contents of your message.</li>
          <li>
            Once accounts and checkout are available: order history, shipping and billing details,
            saved addresses, and any products you save to a wishlist.
          </li>
        </ul>
        <p>Information collected automatically:</p>
        <ul className="list-disc pl-5">
          <li>
            A collection-specific cookie that can remember valid early access to an upcoming
            collection (see Cookies below).
          </li>
          <li>Standard web server logs (such as IP address and browser type).</li>
          <li>
            When analytics is configured (see Cookies below), aggregate usage information such as
            pages viewed and products browsed.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Cookies &amp; Similar Technologies">
        <p>
          Upcoming collections can use a collection-specific access cookie after a valid code is
          entered. The ordinary storefront is accessible without a whole-site password. Access
          cookies support collection access and are separate from advertising.
        </p>
        <p>
          Recently viewed products, saved items, and the demonstration bag use browser storage.
          These features retain shopping choices on this device. When storage is unavailable, some
          choices remain available only for the current visit. Clear your browser site data to
          remove stored choices.
        </p>
        <p>
          Google Analytics instrumentation is enabled only when a measurement ID is configured.
          Shopify services and analytics depend on the connected store. The final policy will
          describe the configured services, their cookies, retention, and any required consent
          choices before launch.
        </p>
      </PolicySection>

      <PolicySection title="How We Use Information">
        <ul className="list-disc pl-5">
          <li>To process consented requests for future collection updates.</li>
          <li>
            To send collection announcements, early-access invitations, and other marketing email —
            only to visitors who&apos;ve given consent, and only through Esque&apos;s email
            provider, Klaviyo.
          </li>
          <li>To operate, maintain, and improve the site.</li>
          <li>
            Once checkout is available: to process orders, payments, shipping, and returns through
            Shopify.
          </li>
          <li>To respond to support requests.</li>
          <li>To comply with applicable law.</li>
        </ul>
      </PolicySection>

      <PolicySection title="How We Share Information">
        <p>Esque does not sell personal information. Information is shared only with:</p>
        <ul className="list-disc pl-5">
          <li>
            Shopify, which processes orders, payments, and customer records on Esque&apos;s behalf.
          </li>
          <li>Klaviyo, which delivers Esque&apos;s email communications.</li>
          <li>
            <Placeholder>the shipping carrier(s) Esque selects</Placeholder>, which receive the
            shipping information needed to deliver an order.
          </li>
          <li>
            Analytics providers (Google Analytics 4, Google Search Console, Shopify Analytics), once
            instrumented.
          </li>
          <li>Service providers who host or operate the site (currently Vercel).</li>
          <li>Law enforcement or regulators, where required by law.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Data Retention">
        <p>
          <Placeholder>
            specific retention periods for account, order, and marketing data have not yet been
            finalized
          </Placeholder>
          . Esque retains information for as long as needed to provide the site, fulfill orders, and
          meet legal and accounting obligations, and deletes or anonymizes it afterward.
        </p>
      </PolicySection>

      <PolicySection title="Your Rights &amp; Choices">
        <ul className="list-disc pl-5">
          <li>
            You can unsubscribe from marketing email at any time using the link in any Esque email.
          </li>
          <li>
            Depending on where you live, you may have the right to access, correct, or delete the
            personal information Esque holds about you, and to opt out of certain uses.{' '}
            <Placeholder>
              the specific request process and any state-law-specific disclosures (for example,
              California) have not yet been finalized with counsel
            </Placeholder>
            .
          </li>
          <li>
            To exercise a privacy right or ask a question about this policy, contact Esque — see{' '}
            <Link
              href="/contact"
              className="underline underline-offset-4 hover:text-esque-text-secondary"
            >
              Contact
            </Link>
            .
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Children's Privacy">
        <p>
          Esque&apos;s website is not directed at children, and Esque does not knowingly collect
          personal information from children under 13. Purchases require a person with legal
          capacity to enter into a contract — see the{' '}
          <Link
            href="/legal/terms"
            className="underline underline-offset-4 hover:text-esque-text-secondary"
          >
            Terms of Service
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="Data Security">
        <p>
          Esque uses reasonable administrative and technical safeguards to protect the information
          it collects, and relies on Shopify and Klaviyo&apos;s own security measures for payment
          and email data. No method of transmission or storage is completely secure, and Esque
          cannot guarantee absolute security.
        </p>
      </PolicySection>

      <PolicySection title="Where We Operate">
        <p>
          Collection 001 ships within the United States only. Information Esque collects is
          processed and stored in the United States.
        </p>
      </PolicySection>

      <PolicySection title="Changes to This Policy">
        <p>
          Esque may update this policy as its business operations, and the tools it uses, change.
          Material changes will be reflected by updating the draft date at the top of this page.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          Questions about this policy or your information can be directed to Esque through{' '}
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
