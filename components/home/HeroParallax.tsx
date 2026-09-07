'use client';

import { useEffect, useRef } from 'react';
import { hasFinePointerAndHover, prefersReducedMotion } from '@/lib/motion/media';

// DESIGN_SYSTEM.md §27 / DECISIONS.md D-032 — "Subtle mouse movement creates
// depth between typography, model, and background. Movement should stay
// within a few pixels." A thin client wrapper (`display: contents` — adds a
// script/ref hook with zero layout-box impact, so it cannot disturb
// CollectionHero's existing flex/absolute positioning relationships) around
// the three server-rendered Hero layers. A window-level pointermove listener
// (matching EntranceMotion's own existing full-viewport tracking convention)
// writes two CSS custom properties directly onto this node via
// `style.setProperty` — never through React state, so pointer movement
// causes zero re-renders. Each layer reads `--parallax-x`/`--parallax-y`
// via a shared `.esque-parallax-layer` CSS class and its own `--depth`.
//
// Deliberately no `motion` import, unlike EntranceMotion — see the design
// spec's "Why not motion" note: loading it a second time on the homepage's
// LCP-critical route to reproduce an effect this simple would repeat
// ROADMAP.md Phase 12's own flagged ~119KB-on-/access concern on a more
// important route. See DECISIONS.md D-041.
export function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion(window.matchMedia) || !hasFinePointerAndHover(window.matchMedia)) {
      return;
    }

    const el = ref.current;
    if (!el) return;

    let frame = 0;
    function handlePointerMove(event: PointerEvent) {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;
        el!.style.setProperty('--parallax-x', x.toFixed(4));
        el!.style.setProperty('--parallax-y', y.toFixed(4));
      });
    }

    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} data-hero-parallax className="contents">
      {children}
    </div>
  );
}
