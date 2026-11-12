import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { CollectionCloset } from '@/components/home/CollectionCloset';
import { CollectionStatement } from '@/components/home/CollectionStatement';
import { DropStatus } from '@/components/home/DropStatus';
import { SelectedPieces } from '@/components/home/SelectedPieces';
import { LooksSection } from '@/components/looks/LooksSection';
import { getClosetCollection } from '@/lib/home/closet';
import { getSelectedPieces } from '@/lib/home/selected-pieces';
import { getHomepageLooks } from '@/lib/looks/looks';

// ROADMAP.md Phase 7/8 — the real homepage. Scene order matches PROJECT.md
// §23 and DESIGN_SYSTEM.md §58's Mobile Homepage sequence exactly. Scene 07
// (Archive Preview) is deliberately omitted — see the homepage design
// spec's Non-Goals. The Collection Closet, Selected Pieces, and the
// Shop the Look ring are this page's three independent Shopify dependencies
// — fetched concurrently (none depends on another) and each isolated so a
// failure in one never affects the other scenes (DECISIONS.md
// D-033/D-089/D-091).
export default async function Home() {
  const [closetCollection, selectedPieces, looks] = await Promise.all([
    getClosetCollection(),
    getSelectedPieces(),
    getHomepageLooks(),
  ]);

  return (
    <>
      <CollectionCloset collection={closetCollection} />
      <LooksSection looks={looks} />
      <CollectionStatement />
      <SelectedPieces products={selectedPieces} />
      <CategoryShowcase />
      <DropStatus />
    </>
  );
}
