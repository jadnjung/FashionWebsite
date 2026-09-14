// SEARCH/ACCOUNT/BAG in Header.tsx have no real behavior yet — SEARCH lands
// in ROADMAP.md Phase 4, ACCOUNT in Phase 10, BAG needs a real cart (Phase 2)
// — all three gated on a real Shopify store. Rather than a silent no-op
// (reported as feeling broken during a project-owner walkthrough), clicking
// any of them shows this brief, on-brand acknowledgment instead. Reuses the
// terse, period-terminated "ARRIVING SOON." voice already established for
// the Interactive Model's own not-yet-built placeholder (see
// components/interactive-model/InteractiveModelPlaceholder.tsx) rather than
// inventing new copy.
export type ComingSoonFeature = 'SEARCH' | 'ACCOUNT' | 'BAG';

interface ComingSoonNoticeProps {
  feature: ComingSoonFeature | null;
}

export function ComingSoonNotice({ feature }: ComingSoonNoticeProps) {
  return (
    // role="status" (polite, not "alert" — this isn't urgent, matching the
    // same "polite" treatment already given to Request Access's own success
    // state, DECISIONS.md D-051's ACCESS SENT. block).
    //
    // Always mounted with the live region already present, never
    // conditionally rendered: some screen readers only pick up content
    // changes in a role="status"/aria-live region if it existed in the
    // accessibility tree *before* the change, so toggling the element's
    // existence (or using the `hidden` attribute, which removes it from
    // that tree exactly like unmounting) risks the first announcement being
    // silently missed. Instead, only the *content and visual presentation*
    // toggle: an empty region announces nothing and collapses visually via
    // `sr-only` when there's no active feature, becoming a normal visible
    // bordered box the instant one is set.
    <p
      role="status"
      className={
        feature
          ? 'absolute right-4 top-full z-10 mt-2 border border-esque-text-secondary bg-esque-surface px-3 py-2 text-utility uppercase tracking-metadata text-esque-text-secondary md:right-8'
          : 'sr-only'
      }
    >
      {feature ? `${feature} — ARRIVING SOON.` : ''}
    </p>
  );
}
