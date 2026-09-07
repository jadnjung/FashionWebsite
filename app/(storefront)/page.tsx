import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { CollectionHero } from '@/components/home/CollectionHero';
import { CollectionStatement } from '@/components/home/CollectionStatement';
import { DropStatus } from '@/components/home/DropStatus';
import { SelectedPieces } from '@/components/home/SelectedPieces';
import { InteractiveModel } from '@/components/interactive-model/InteractiveModel';
import { getInteractiveModelLook } from '@/lib/interactive-model/look';
import { getSelectedPieces } from '@/lib/home/selected-pieces';

// ROADMAP.md Phase 7/8 — the real homepage. Scene order matches PROJECT.md
// §23 and DESIGN_SYSTEM.md §58's Mobile Homepage sequence exactly. Scene 07
// (Archive Preview) is deliberately omitted — see the homepage design
// spec's Non-Goals. Selected Pieces and the Interactive Model are this
// page's two independent Shopify dependencies — fetched concurrently
// (neither depends on the other) and each isolated so a failure in one
// never affects the other five scenes (DECISIONS.md D-033/D-034).
export default async function Home() {
  const [selectedPieces, interactiveModelLook] = await Promise.all([
    getSelectedPieces(),
    getInteractiveModelLook(),
  ]);

  return (
    <>
      <CollectionHero />
      <InteractiveModel garments={interactiveModelLook} />
      <CollectionStatement />
      <SelectedPieces products={selectedPieces} />
      <CategoryShowcase />
      <DropStatus />
    </>
  );
}
