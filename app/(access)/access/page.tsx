import type { Metadata } from 'next';
import { EntranceMotion } from './EntranceMotion';
import { AccessForm } from './AccessForm';

// A gate/utility page, not real content — excluded from indexing. Crawlers
// still reach it directly if they discover the literal URL (proxy.ts lets
// bots through everywhere, including here), but it's not worth surfacing
// as a search result. Doesn't affect the SEO rule this feature must
// preserve (DECISIONS.md D-005): that's about product/collection routes
// staying crawlable, not about this specific utility page being indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccessPage() {
  // This route renders outside app/(storefront)/layout.tsx's shell, so it
  // doesn't inherit ShellClient's <main id="main-content">. Without an
  // explicit landmark here, the gate — the first page most visitors ever
  // see — would have none at all. No id: no skip link targets this route
  // (mirrors the fix already applied to app/not-found.tsx and
  // app/error.tsx for the same shell-less reason).
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-esque-black px-4 py-16">
      <EntranceMotion />
      <div className="relative z-10">
        <AccessForm />
      </div>
    </main>
  );
}
