'use client';

import { useEffect, useState } from 'react';

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Explicit UTC timezone, not the environment's local one: this must be
// deterministic between the server (Node, whichever TZ it happens to run
// in) and the client's first hydration render (the visitor's own local
// timezone) — both have to compute byte-identical output on first paint,
// see this component's own header comment below. Without pinning a
// timezone, `toLocaleDateString` would use each environment's own local
// time, which can disagree on which calendar day a given instant falls on.
function formatTargetDate(timestamp: number): string {
  return new Date(timestamp)
    .toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

function getRemaining(targetTimestamp: number, now: number): Remaining {
  const diffMs = Math.max(0, targetTimestamp - now);
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * SSR-safe countdown to `targetTimestamp` (epoch ms, computed by the
 * server-rendered parent — CollectionTeaser.tsx — from the collection's
 * own `dropDate`). SSR-safety is load-bearing here: this codebase has
 * already been bitten twice by exactly this class of hydration mismatch
 * (DECISIONS.md D-047, D-051 Finding 1), both involving a value that
 * differs between server-render-time and the client's first hydration
 * pass. A countdown is structurally the same risk — `Date.now()`
 * necessarily differs between when the server rendered and when the
 * client hydrates.
 *
 * The fix: this component's first render — server and client alike —
 * never calls `Date.now()` or reads any clock. `remaining` starts `null`
 * and the static, deterministic target-date line below renders instead,
 * computed purely from the `targetTimestamp` prop. Only inside a
 * `useEffect` (which by definition runs strictly after hydration, never
 * during it) does a `setInterval` begin reading `Date.now()` and
 * populating `remaining` with live numbers. This guarantees the first
 * client render is byte-identical to the server's — no mismatch is
 * possible — and ticking only ever begins after that first paint is
 * already committed.
 *
 * No `aria-live` region on the ticking numbers: announcing a per-second
 * change would be disruptive noise for screen-reader users, not a useful
 * update (unlike a one-time state change, which this isn't). Respects
 * `prefers-reduced-motion` by construction — a plain text content update
 * (no transform/animation around the numbers themselves) doesn't need
 * suppressing under reduced motion per DESIGN_SYSTEM.md §63's "retain:
 * fades, state changes" carve-out.
 */
export function DropCountdown({ targetTimestamp }: { targetTimestamp: number }) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    function tick() {
      setRemaining(getRemaining(targetTimestamp, Date.now()));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  if (!remaining) {
    return (
      <p className="font-display text-heading-2 uppercase tracking-display text-esque-text">
        LAUNCHES {formatTargetDate(targetTimestamp)}
      </p>
    );
  }

  return (
    <p className="font-display text-heading-2 uppercase tracking-display text-esque-text">
      {remaining.days}D {remaining.hours}H {remaining.minutes}M {remaining.seconds}S
    </p>
  );
}
