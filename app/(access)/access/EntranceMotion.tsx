'use client';

import { useReducedMotion, useMotionValue, useTransform, motion } from 'motion/react';
import type { PointerEvent } from 'react';

// Esque's own easing curve (app/globals.css --ease-esque), expressed as the
// numeric cubic-bezier motion/react's `transition.ease` accepts, so the
// JS-driven entrance matches the rest of the project's CSS-driven motion.
const ESQUE_EASE = [0.22, 1, 0.36, 1] as const;

// Simple abstract SVG silhouettes (placeholder imagery — see this
// feature's design spec) at three depths. Depth scales how far each layer
// moves under cursor parallax: closer layers (higher depth) move more.
const SILHOUETTE_LAYERS = [
  {
    depth: 0.3,
    className: 'left-[8%] top-[12%] h-[70vh] w-auto text-esque-forest/25',
    viewBox: '0 0 200 560',
    path: 'M100 40 C 60 40 40 90 45 160 L 35 480 C 33 520 167 520 165 480 L 155 160 C 160 90 140 40 100 40 Z',
  },
  {
    depth: 0.6,
    className: 'right-[10%] top-[18%] h-[55vh] w-auto text-esque-elevated',
    viewBox: '0 0 200 510',
    path: 'M100 30 C 80 30 70 60 72 90 L 60 200 C 20 260 10 420 30 480 L 170 480 C 190 420 180 260 140 200 L 128 90 C 130 60 120 30 100 30 Z',
  },
  {
    depth: 1.0,
    className: 'left-[42%] bottom-[6%] h-[40vh] w-auto text-esque-text-muted/60',
    viewBox: '0 0 200 500',
    path: 'M40 20 L 160 20 L 165 240 L 110 240 L 100 480 L 80 480 L 90 240 L 35 240 Z',
  },
] as const;

function SilhouetteLayer({
  layer,
  pointerX,
  pointerY,
  prefersReducedMotion,
}: {
  layer: (typeof SILHOUETTE_LAYERS)[number];
  pointerX: ReturnType<typeof useMotionValue<number>>;
  pointerY: ReturnType<typeof useMotionValue<number>>;
  prefersReducedMotion: boolean | null;
}) {
  // Rules of Hooks: called unconditionally regardless of reduced-motion —
  // whether the result is applied to `style` is what's conditional below.
  const x = useTransform(pointerX, [-1, 1], [-24 * layer.depth, 24 * layer.depth]);
  const y = useTransform(pointerY, [-1, 1], [-14 * layer.depth, 14 * layer.depth]);

  return (
    <motion.svg
      viewBox={layer.viewBox}
      fill="currentColor"
      style={prefersReducedMotion ? undefined : { x, y }}
      className={`absolute ${layer.className}`}
    >
      <path d={layer.path} />
    </motion.svg>
  );
}

export function EntranceMotion() {
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return;
    const { innerWidth, innerHeight } = window;
    // Normalize to roughly [-1, 1] from viewport center.
    pointerX.set((event.clientX / innerWidth) * 2 - 1);
    pointerY.set((event.clientY / innerHeight) * 2 - 1);
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
    >
      {SILHOUETTE_LAYERS.map((layer) => (
        <SilhouetteLayer
          key={layer.depth}
          layer={layer}
          pointerX={pointerX}
          pointerY={pointerY}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
      {/* Giant background typography (DESIGN_SYSTEM.md §53 layer 4) — large
          and low-opacity so it reads as atmosphere, distinct from
          AccessForm's smaller, sharp "ENTER ESQUE" functional heading on
          top of it. Quick per PROJECT.md §14: "Motion must remain quick...
          never become an obstacle for returning users." */}
      <motion.h2
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: ESQUE_EASE }}
        className="absolute inset-0 flex items-center justify-center font-display text-display-xl tracking-display text-esque-text/15"
      >
        ESQUE
      </motion.h2>
    </div>
  );
}
