// Shared section wrapper for the long-form legal/policy pages under
// /legal/*. Extracted because the same heading+body structure repeats
// roughly a dozen times per page across six pages — hand-repeating the
// same two classNames at every call site would risk exactly the kind of
// drift DECISIONS.md D-036 already named for VariantPicker's markup.
// Children-based composition (not a data-driven renderer) keeps each
// page's actual prose directly readable/editable in its own file — the
// content itself is what a future legal review will revise, so it should
// read as plain JSX, not as entries in a generic content array.
export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-body text-esque-text">{children}</div>
    </section>
  );
}
