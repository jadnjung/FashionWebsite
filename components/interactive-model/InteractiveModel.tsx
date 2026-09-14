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
  // Demo Mode (DECISIONS.md D-057) — read here (a Server Component) and
  // threaded down as a prop, not read inside the client-bundled
  // InteractiveModelExperience/SilhouetteIllustration — see the latter's
  // prop doc for why a bare (non-NEXT_PUBLIC_) env var can only be read
  // server-side.
  const previewDemoMode = process.env.PREVIEW_DEMO_MODE === '1';
  return <InteractiveModelExperience garments={garments} previewDemoMode={previewDemoMode} />;
}
