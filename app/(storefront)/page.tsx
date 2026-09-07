import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { CollectionHero } from '@/components/home/CollectionHero';
import { CollectionStatement } from '@/components/home/CollectionStatement';
import { DropStatus } from '@/components/home/DropStatus';
import { InteractiveModel } from '@/components/interactive-model/InteractiveModel';
import { SelectedPieces } from '@/components/home/SelectedPieces';
import { getSelectedPieces } from '@/lib/home/selected-pieces';

// ROADMAP.md Phase 7 — the real homepage. Scene order matches PROJECT.md
// §23 and DESIGN_SYSTEM.md §58's Mobile Homepage sequence exactly (both
// agree: Hero -> Interactive Model -> Collection Statement -> Selected
// Pieces -> Categories -> Drop Status). Scene 07 (Archive Preview) is
// deliberately omitted — see the design spec's Non-Goals. Selected
// Pieces' fetch is the page's only Shopify dependency, isolated in
// lib/home/selected-pieces.ts (DECISIONS.md D-033) so a Shopify failure
// never affects the other five scenes.
export default async function Home() {
  const selectedPieces = await getSelectedPieces();

  return (
    <>
      <CollectionHero />
      <InteractiveModel garments={[]} />
      <CollectionStatement />
      <SelectedPieces products={selectedPieces} />
      <CategoryShowcase />
      <DropStatus />
    </>
  );
}
