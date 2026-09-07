import { InteractiveModelExperience } from '@/components/interactive-model/InteractiveModelExperience';
import { InteractiveModelPlaceholder } from '@/components/interactive-model/InteractiveModelPlaceholder';
import { HOTSPOT_REGIONS, type InteractiveModelGarment } from '@/lib/interactive-model/look';

interface InteractiveModelProps {
  garments: InteractiveModelGarment[];
}

// DECISIONS.md D-034 — renders the real experience only once every
// configured hotspot region resolved a real product; otherwise falls back
// to the existing, honest placeholder (mirrors DECISIONS.md D-033's
// graceful-degradation precedent). A partial result (e.g. Tops resolved
// but Bottoms didn't) is treated the same as a total failure — a figure
// with only one garment drawn would read as broken, not intentional.
export function InteractiveModel({ garments }: InteractiveModelProps) {
  if (garments.length < HOTSPOT_REGIONS.length) {
    return <InteractiveModelPlaceholder />;
  }
  return <InteractiveModelExperience garments={garments} />;
}
