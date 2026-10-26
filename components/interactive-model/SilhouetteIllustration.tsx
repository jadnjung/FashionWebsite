/// <reference types="react/experimental" />
// Activates react/experimental's ambient ViewTransition types — see
// ProductCard.tsx for the full explanation of why this is a triple-slash
// directive, not `import {} from 'react/experimental'`. DECISIONS.md D-038.
import Image from 'next/image';
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
export const REGION_SHAPES: Record<HotspotRegion, RegionShape> = {
  top: {
    box: { top: '12%', left: '20%', width: '60%', height: '46%' },
    clipPath: 'polygon(20% 0%, 80% 0%, 100% 15%, 85% 20%, 85% 100%, 15% 100%, 15% 20%, 0% 15%)',
  },
  bottom: {
    box: { top: '62%', left: '21.25%', width: '57.5%', height: '34%' },
    clipPath: 'polygon(0% 0%, 100% 0%, 95% 100%, 65% 100%, 60% 35%, 40% 35%, 35% 100%, 5% 100%)',
  },
};

// Demo Mode shapes — calibrated against the real stock photo at
// /preview-demo/model-full.jpg (900x1125, a 4:5 ratio matching the
// illustration's own aspect-[4/5] rendering, so image percentages map
// directly to box/clipPath percentages with no object-cover crop to account
// for). REGION_SHAPES above was hand-authored for the abstract placeholder
// silhouette and does not line up with this photo's actual garment
// silhouettes (shoulder/hem lines, crossed-leg stance) — see the "bug"
// section of the task that produced this constant for the live-reproduced
// mismatch. These percentages were derived by sampling the photo's own
// pixels (isolating near-black, low-saturation regions to exclude the
// model's auburn hair and skin) and verified visually by rendering the
// resulting clip-path polygons back over the source photo. If
// model-full.jpg is ever replaced with different photography or a
// different pose, these values will need to be recalibrated the same way —
// they trace this specific photo, not a generic "top"/"bottom" region.
export const DEMO_REGION_SHAPES: Record<HotspotRegion, RegionShape> = {
  // Black sleeveless cropped top: narrow high neckline, flares out to the
  // shoulders/armholes, widest across the ribcage, with an asymmetric
  // diagonal hem (shorter on the model's right, longer/lower on her left).
  top: {
    box: { top: '18%', left: '32%', width: '27%', height: '22%' },
    clipPath: 'polygon(33% 5%, 56% 18%, 78% 36%, 96% 64%, 96% 91%, 19% 95%, 4% 59%, 15% 18%)',
  },
  // Black high-waisted wide-leg trousers in a crossed/scissor stance: narrow
  // waistband, widening hips, then two legs splitting apart below the
  // crotch — one reaching down-and-left, the other down-and-right.
  bottom: {
    box: { top: '38%', left: '12%', width: '61%', height: '52%' },
    clipPath:
      'polygon(54% 2%, 72% 2%, 90% 27%, 97% 54%, 93% 97%, 72% 97%, 75% 58%, 67% 37%, 56% 58%, 31% 97%, 2% 94%, 21% 72%, 44% 27%)',
  },
};

interface SilhouetteIllustrationProps {
  garments: InteractiveModelGarment[];
  activeRegion: HotspotRegion | null;
  onHover: (region: HotspotRegion) => void;
  onActivate: (region: HotspotRegion) => void;
  // Demo Mode (PREVIEW_DEMO_MODE) — an opt-in, off-by-default stand-in for
  // real photography; see lib/shopify/preview-demo-fixtures.ts's file
  // header and DECISIONS.md D-057. Threaded down from InteractiveModel.tsx
  // (a Server Component, where reading process.env.PREVIEW_DEMO_MODE
  // actually works) rather than read here directly — this file is part of
  // InteractiveModelExperience's client bundle, where a non-NEXT_PUBLIC_
  // env var is never inlined and would silently always read as unset.
  previewDemoMode?: boolean;
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
  previewDemoMode = false,
}: SilhouetteIllustrationProps) {
  const shapes = previewDemoMode ? DEMO_REGION_SHAPES : REGION_SHAPES;
  return (
    <div className="relative aspect-[4/5] w-full bg-esque-elevated">
      {previewDemoMode ? (
        <Image
          src="/preview-demo/model-full.jpg"
          alt=""
          fill
          sizes="(min-width: 768px) 384px, 100vw"
          className="object-cover"
        />
      ) : (
        // text-esque-text-secondary, not text-esque-text-muted — DECISIONS.md
        // D-048: muted fails WCAG AA's 4.5:1 contrast minimum for this
        // normal-size text against the elevated background.
        <p className="pointer-events-none absolute bottom-2 right-2 text-utility uppercase tracking-metadata text-esque-text-secondary">
          ESQUE PLACEHOLDER — MODEL, FULL BODY
        </p>
      )}
      {garments.map((garment) => {
        const shape = shapes[garment.region];
        const isActive = activeRegion === garment.region;
        const isDimmed = activeRegion !== null && !isActive;
        const style: CSSProperties = {
          top: shape.box.top,
          left: shape.box.left,
          width: shape.box.width,
          height: shape.box.height,
          clipPath: shape.clipPath,
        };
        // Demo Mode (a real photo underneath, via the sibling <Image> above)
        // needs a much lower fill opacity than the abstract placeholder: the
        // placeholder IS a flat color (nothing to see through), but a
        // near-opaque fill here would paint over the garment's own
        // fabric/texture. Same previewDemoMode reason as the `shapes`
        // selection above. DECISIONS.md D-079 covers this; D-034's Stage 4/5
        // masked-luminance treatment remains separately deferred — this is
        // just an opacity fix, not that treatment.
        const fillClass = previewDemoMode
          ? isActive
            ? 'bg-esque-forest-highlight/15'
            : isDimmed
              ? 'bg-esque-text-muted/30'
              : 'bg-esque-text-muted/10'
          : isActive
            ? 'bg-esque-forest-highlight'
            : isDimmed
              ? 'bg-esque-text-muted/40'
              : 'bg-esque-text-muted/60';
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
              className={`absolute border-0 p-0 transition-colors duration-200 ease-esque focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text ${fillClass}`}
            />
          </ViewTransition>
        );
      })}
    </div>
  );
}
