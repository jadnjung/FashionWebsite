import type { Metadata } from 'next';
import { Grid } from '@/components/ui/Grid';
import { Input } from '@/components/ui/Input';

// Internal-only preview route — never linked from navigation, never meant
// for real visitors or search engines. Grid and Input (ROADMAP.md Phase 1)
// have no real page consuming them yet; this route exists solely so
// Playwright has a real rendered instance of each to test against, per
// DECISIONS.md D-012. Remove a section here once its primitive gets a
// real consumer and its tests move to cover that instead.
export const metadata: Metadata = {
  title: 'UI Primitives — Esque Dev',
  robots: { index: false, follow: false },
};

export default function UiPreviewPage() {
  return (
    <div className="flex flex-col gap-16 py-16">
      <section aria-labelledby="grid-heading" className="flex flex-col gap-4">
        <h2 id="grid-heading" className="px-4 text-heading-3 text-esque-text">
          Grid
        </h2>
        <Grid id="grid-preview">
          {Array.from({ length: 12 }, (_, index) => (
            <div
              key={index}
              className="flex h-16 items-center justify-center bg-esque-elevated text-utility text-esque-text-secondary"
            >
              {index + 1}
            </div>
          ))}
        </Grid>
      </section>

      <section aria-labelledby="input-heading" className="flex flex-col gap-6 px-4">
        <h2 id="input-heading" className="text-heading-3 text-esque-text">
          Input
        </h2>

        <div className="flex max-w-sm flex-col gap-2">
          <label htmlFor="preview-email" className="text-utility text-esque-text-secondary">
            Email
          </label>
          <Input id="preview-email" name="email" type="email" placeholder="you@esque.com" />
        </div>

        <div className="flex max-w-sm flex-col gap-2">
          <label htmlFor="preview-invalid" className="text-utility text-esque-text-secondary">
            Invalid example
          </label>
          <Input
            id="preview-invalid"
            name="invalid-example"
            type="text"
            aria-invalid="true"
            defaultValue="not-an-email"
          />
        </div>

        <div className="flex max-w-sm flex-col gap-2">
          <label htmlFor="preview-disabled" className="text-utility text-esque-text-secondary">
            Disabled example
          </label>
          <Input
            id="preview-disabled"
            name="disabled-example"
            type="text"
            disabled
            defaultValue="Locked"
          />
        </div>
      </section>
    </div>
  );
}
