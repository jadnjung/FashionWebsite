// DESIGN_SYSTEM.md §32 — typography-first editorial statement. Real,
// finished copy: the large statement is DESIGN_SYSTEM.md's own worked
// example for this scene. It is not independently reproduced in
// CONTENT.md's canonical copy list the way Scene 06's Drop Status block
// is — flagged as reasonably real but revisit if official campaign copy
// supersedes it. No imagery this pass: unlike Scenes 01/04, this scene has
// no photography dependency (PROJECT.md §101), so it ships fully resolved
// rather than partially placeholder.
export function CollectionStatement() {
  return (
    <section
      aria-label="Collection Statement"
      className="flex min-h-[60svh] flex-col items-center justify-center gap-6 bg-esque-black px-4 text-center"
    >
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        COLLECTION 001
      </p>
      <h2 className="max-w-4xl font-display text-display-l uppercase leading-none tracking-display text-esque-text">
        NOT MADE TO REMAIN.
      </h2>
    </section>
  );
}
