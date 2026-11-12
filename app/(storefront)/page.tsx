import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { CollectionCloset } from '@/components/home/CollectionCloset';
import { CollectionStatement } from '@/components/home/CollectionStatement';
import { DropStatus } from '@/components/home/DropStatus';
import { SelectedPieces } from '@/components/home/SelectedPieces';
import { InteractiveModel } from '@/components/interactive-model/InteractiveModel';
import { getInteractiveModelLook } from '@/lib/interactive-model/look';
import { getClosetCollection } from '@/lib/home/closet';
import { getSelectedPieces } from '@/lib/home/selected-pieces';

// ROADMAP.md Phase 7/8 — the real homepage. Scene order matches PROJECT.md
// §23 and DESIGN_SYSTEM.md §58's Mobile Homepage sequence exactly. Scene 07
// (Archive Preview) is deliberately omitted — see the homepage design
// spec's Non-Goals. The Collection Closet, Selected Pieces, and the
// Interactive Model are this page's three independent Shopify dependencies
// — fetched concurrently (none depends on another) and each isolated so a
// failure in one never affects the other scenes (DECISIONS.md
// D-033/D-034/D-089).
export default async function Home() {
  const [closetCollection, selectedPieces, interactiveModelLook] = await Promise.all([
    getClosetCollection(),
    getSelectedPieces(),
    getInteractiveModelLook(),
  ]);

  return (
    <>
      <CollectionCloset collection={closetCollection} />
      <InteractiveModel garments={interactiveModelLook} />
      <CollectionStatement />
      <SelectedPieces products={selectedPieces} />
      <CategoryShowcase />
      <DropStatus />
    </>
  );
}
