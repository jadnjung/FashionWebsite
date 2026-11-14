import Link from 'next/link';
import type { ProductDetail } from '@/lib/shopify/products';

interface ProductInformationProps {
  information?: ProductDetail['information'];
}

const sections = [
  {
    key: 'materials',
    title: 'Materials',
    pending: 'Material composition will be confirmed before release.',
  },
  {
    key: 'fit',
    title: 'Fit and sizing',
    pending: 'Fit and measurements will be confirmed before release.',
  },
  { key: 'care', title: 'Care', pending: 'Care instructions will be confirmed before release.' },
] as const;

const summaryClass =
  'cursor-pointer py-4 text-utility uppercase tracking-metadata text-esque-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text';

export function ProductInformation({ information }: ProductInformationProps) {
  return (
    <section aria-label="Product information" className="border-t border-esque-surface">
      {sections.map(({ key, title, pending }) => (
        <details key={key} className="border-b border-esque-surface">
          <summary className={summaryClass}>{title}</summary>
          <p className="whitespace-pre-line pb-5 text-body text-esque-text-secondary">
            {information?.[key] || pending}
          </p>
        </details>
      ))}
      <details className="border-b border-esque-surface">
        <summary className={summaryClass}>Shipping</summary>
        <p className="pb-3 text-body text-esque-text-secondary">
          Shipping options and rates will be confirmed before checkout is enabled.
        </p>
        <Link
          href="/legal/shipping"
          className="mb-3 inline-flex min-h-11 items-center text-utility text-esque-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-esque-text"
        >
          Shipping policy
        </Link>
      </details>
      <details className="border-b border-esque-surface">
        <summary className={summaryClass}>Returns</summary>
        <p className="pb-3 text-body text-esque-text-secondary">
          The returns policy is being finalized.
        </p>
        <Link
          href="/legal/returns"
          className="mb-3 inline-flex min-h-11 items-center text-utility text-esque-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-esque-text"
        >
          Returns policy
        </Link>
      </details>
    </section>
  );
}
