import { BagView } from '@/components/cart/BagView';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata = {
  ...buildPageMetadata({
    title: 'Bag — Esque',
    description: 'Review your selected pieces.',
    path: '/bag',
  }),
  robots: { index: false, follow: false },
};

export default function BagPage() {
  return <BagView />;
}
