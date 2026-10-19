'use client';

import { useEffect } from 'react';
import { DropAccessForm } from './DropAccessForm';
import { DropCountdown } from './DropCountdown';
import { trackEvent } from '@/lib/analytics/gtag';

// Deliberately narrow — only `handle`/`title`/`dropDate`, not the full
// CollectionDetail/CollectionSummary shape. This is enforced at the type
// level, not just by convention: page.tsx must never pass
// `collection.description` or any product data into the locked teaser
// (the collection's real campaign copy and photography stay hidden until
// a code is entered or the public dropDate passes), and a narrower prop
// type makes that mistake a compile error rather than a code-review habit.
export interface CollectionTeaserProps {
  handle: string;
  title: string;
  dropDate: string;
}

export function CollectionTeaser({ handle, title, dropDate }: CollectionTeaserProps) {
  // Access Funnel (drop-gate analog): fires once per mount of the locked
  // teaser — the collection-scoped funnel-entry role the deleted whole-site
  // gate's access_gate_view used to play.
  useEffect(() => {
    trackEvent('drop_teaser_view', { collection_handle: handle });
  }, [handle]);

  return (
    <div className="flex flex-col items-center gap-10 px-4 py-24 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          {title.toUpperCase()}
        </p>
        <DropCountdown targetTimestamp={new Date(dropDate).getTime()} />
      </div>
      {/* Obscured imagery: PROJECT.md §42's own vocabulary (partially
          obscured/blurred imagery, product silhouettes) — there is no real
          upcoming-drop photography in this environment, so this is a
          clearly-labeled placeholder block (DESIGN_SYSTEM.md §65's
          established "ESQUE PLACEHOLDER" convention, styled via
          text-esque-text-secondary per DECISIONS.md D-048) with a real
          `blur` filter applied on top — demonstrating the actual mechanism
          that would genuinely obscure real photography once it exists,
          not just describing it. */}
      <div
        aria-hidden="true"
        className="flex h-[40vh] w-full max-w-md items-center justify-center bg-esque-elevated blur-lg"
      >
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          ESQUE PLACEHOLDER — COLLECTION, OBSCURED
        </p>
      </div>
      <DropAccessForm handle={handle} />
    </div>
  );
}
