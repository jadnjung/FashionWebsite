/// <reference types="react/experimental" />
// Activates react/experimental's ambient ViewTransition types — see
// ProductCard.tsx for the full explanation of why this is a triple-slash
// directive, not `import {} from 'react/experimental'`. DECISIONS.md D-038.
import type { CSSProperties } from 'react';
import { ViewTransition } from 'react';
import type { HotspotRegion, InteractiveModelGarment } from '@/lib/interactive-model/look';
import { getProductViewTransitionName } from '@/lib/product/view-transition';

interface RegionShape {
  box: { top: string; left: string; width: string; height: string };
  clipPath: string;
}

// Hand-authored abstract placeholder shapes (straight-line polygons only)
// standing in for real campaign photography — DESIGN_SYSTEM.md §65's
// placeholder-labeling convention, §30's "approximately follow garment
// silhouettes... not rectangular" requirement. Both `box` (the button's own
// position/size) and `clipPath` (the visible/hit-testable shape within that
// box) are percentages, so the shapes stay pixel-aligned with the
// illustration's own responsive size at every viewport — see DECISIONS.md
// D-035 for why this is a real <button> + percentage clip-path rather than
// an SVG <path> or a px-based clip-path.
const REGION_SHAPES: Record<HotspotRegion, RegionShape> = {
  top: {
    box: { top: '12%', left: '20%', width: '60%', height: '46%' },
    clipPath: 'polygon(20% 0%, 80% 0%, 100% 15%, 85% 20%, 85% 100%, 15% 100%, 15% 20%, 0% 15%)',
  },
  bottom: {
    box: { top: '62%', left: '21.25%', width: '57.5%', height: '34%' },
    clipPath: 'polygon(0% 0%, 100% 0%, 95% 100%, 65% 100%, 60% 35%, 40% 35%, 35% 100%, 5% 100%)',
  },
};

interface SilhouetteIllustrationProps {
  garments: InteractiveModelGarment[];
  activeRegion: HotspotRegion | null;
  onHover: (region: HotspotRegion) => void;
  onActivate: (region: HotspotRegion) => void;
}

// DESIGN_SYSTEM.md §29-30 — the model illustration and its silhouette-
// shaped hotspots. Each hotspot is a real <button> (native keyboard
// support — DECISIONS.md D-027's "prefer native semantics" precedent, no
// hand-rolled role/keydown wiring) clipped to its garment's shape via
// `clip-path: polygon()` in percentage units, so the visible shape and the
// actual clickable/hoverable hit-region are exactly the same non-
// rectangular area at every viewport width — clip-path constrains
// pointer-event hit-testing, not just paint, in every evergreen browser.
// See DECISIONS.md D-035 for the full reasoning (why not SVG-path-as-
// button, why not an ARIA tablist) and D-037 for why focus alone does NOT
// trigger onHover (mouse-only preview; keyboard activates explicitly via
// Enter/Space, which fires onClick regardless of this) — merely tabbing
// past a hotspot must never silently replace what the info panel is
// currently showing. D-039 (ROADMAP.md Phase 9) resolves D-034/D-035's
// deferred click-vs-navigate question: each hotspot now carries a
// shared-element transition name so that the panel's own VIEW PRODUCT
// link (the real navigation trigger, unchanged) morphs into the PDP
// rather than hard-cutting to it. D-043 corrects D-035's original
// click-*toggles*-the-panel description: `onClick` now unconditionally
// activates the region rather than toggling it closed if already active —
// see InteractiveModelExperience.tsx's `handleActivate` for the full
// reasoning (a live-reproduced defect: `mouseenter` always precedes
// `click`, so a toggle could never actually be reached via mouse).
export function SilhouetteIllustration({
  garments,
  activeRegion,
  onHover,
  onActivate,
}: SilhouetteIllustrationProps) {
  return (
    <div className="relative aspect-[4/5] w-full bg-esque-elevated">
      {/* text-esque-text-secondary, not text-esque-text-muted — DECISIONS.md
          D-048: muted fails WCAG AA's 4.5:1 contrast minimum for this
          normal-size text against the elevated background. */}
      <p className="pointer-events-none absolute bottom-2 right-2 text-utility uppercase tracking-metadata text-esque-text-secondary">
        ESQUE PLACEHOLDER — MODEL, FULL BODY
      </p>
      {garments.map((garment) => {
        const shape = REGION_SHAPES[garment.region];
        const isActive = activeRegion === garment.region;
        const isDimmed = activeRegion !== null && !isActive;
        const style: CSSProperties = {
          top: shape.box.top,
          left: shape.box.left,
          width: shape.box.width,
          height: shape.box.height,
          clipPath: shape.clipPath,
        };
        return (
          // DECISIONS.md D-039 — each hotspot always carries the
          // shared-element transition name for its own garment
          // (unconditionally, like ProductCard — the two regions are
          // always different products from different categories, so both
          // can safely carry a name at all times with no collision
          // between them). The panel's own VIEW PRODUCT link is what
          // actually navigates and is what carries the shared-element
          // morph into the PDP.
          <ViewTransition
            key={garment.region}
            name={getProductViewTransitionName(garment.product.handle)}
            share="morph"
            default="none"
          >
            <button
              type="button"
              style={style}
              aria-label={`${garment.regionLabel} — ${garment.product.title}`}
              aria-pressed={isActive}
              onMouseEnter={() => onHover(garment.region)}
              onClick={() => onActivate(garment.region)}
              className={`absolute border-0 p-0 transition-colors duration-200 ease-esque focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text ${
                isActive
                  ? 'bg-esque-forest-highlight'
                  : isDimmed
                    ? 'bg-esque-text-muted/40'
                    : 'bg-esque-text-muted/60'
              }`}
            />
          </ViewTransition>
        );
      })}
    </div>
  );
}
