'use client';

import { useEffect, useRef, useState } from 'react';
import {
  hasFinePointerAndHover,
  isLowPerformanceDevice,
  prefersReducedMotion,
} from '@/lib/motion/media';

const CURSOR_ATTR = 'data-cursor';
const FORM_FIELD_SELECTOR = 'input, textarea, select, [contenteditable="true"]';
const ACTIVE_CLASS = 'esque-cursor-none';

// DESIGN_SYSTEM.md §22-23, INTERACTIONS.md §7 — desktop-only custom cursor
// with an explicit accessibility fallback. Renders nothing at all (the OS
// cursor is left completely untouched) unless every one of: a fine,
// hover-capable pointer (excludes touch/hybrid), motion is not reduced, and
// the device doesn't report an obviously low-power profile — DESIGN_SYSTEM
// §23's exact four-item disable list (the fourth, form inputs, is handled
// per-frame below rather than as an eligibility gate). Even when eligible,
// the OS cursor is never hidden until a real pointermove has actually been
// observed (`initialized`) — DESIGN_SYSTEM §23's explicit rule. See
// DECISIONS.md D-040.
//
// Position is written directly to the DOM via a ref inside the native
// pointermove handler, never through React state, so there is no
// re-render (and no synthetic lag) on the high-frequency hot path —
// DESIGN_SYSTEM §22: "If the cursor feels delayed, disable interpolation."
// Label/form-field state only calls setState when the computed value
// actually changes (tracked via refs), so re-renders happen only on
// meaningful transitions, not on every pixel of movement.
//
// Scoped to the storefront shell only (mounted by ShellClient) — the
// access gate keeps its own existing, already-shipped EntranceMotion
// pointer treatment instead (see the design spec's Non-Goals).
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [overFormField, setOverFormField] = useState(false);
  const initializedRef = useRef(false);
  const labelRef = useRef<string | null>(null);
  const overFormFieldRef = useRef(false);

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (
      prefersReducedMotion(window.matchMedia) ||
      !hasFinePointerAndHover(window.matchMedia) ||
      isLowPerformanceDevice(navigator.hardwareConcurrency, nav.deviceMemory)
    ) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const dot = dotRef.current;
      if (dot) dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;

      if (!initializedRef.current) {
        initializedRef.current = true;
        setInitialized(true);
      }

      const target = event.target as Element | null;
      const nextLabel = target?.closest(`[${CURSOR_ATTR}]`)?.getAttribute(CURSOR_ATTR) ?? null;
      if (nextLabel !== labelRef.current) {
        labelRef.current = nextLabel;
        setLabel(nextLabel);
      }

      const nextOverFormField = target?.closest(FORM_FIELD_SELECTOR) != null;
      if (nextOverFormField !== overFormFieldRef.current) {
        overFormFieldRef.current = nextOverFormField;
        setOverFormField(nextOverFormField);
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(ACTIVE_CLASS, initialized);
    return () => document.documentElement.classList.remove(ACTIVE_CLASS);
  }, [initialized]);

  if (!initialized) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="esque-custom-cursor"
      data-active={label ? 'true' : 'false'}
      data-hidden={overFormField ? 'true' : 'false'}
    >
      {label}
    </div>
  );
}
