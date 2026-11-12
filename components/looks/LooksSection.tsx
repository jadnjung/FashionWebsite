import { LooksExperience } from '@/components/looks/LooksExperience';
import { LooksPlaceholder } from '@/components/looks/LooksPlaceholder';
import type { Look } from '@/lib/shopify/looks';

interface LooksSectionProps {
  looks: Look[];
}

// Homepage Scene 02 — "Shop the Look" (DECISIONS.md D-091): the curated
// looks circling on a ring, replacing the single-look Interactive Model
// (D-034). With no looks yet (no store, or none curated in Shopify admin),
// the honest placeholder shows instead (D-033's pattern).
export function LooksSection({ looks }: LooksSectionProps) {
  if (looks.length === 0) return <LooksPlaceholder />;
  return (
    <section aria-labelledby="shop-the-look-heading" className="overflow-hidden py-24">
      <LooksExperience looks={looks} />
    </section>
  );
}
