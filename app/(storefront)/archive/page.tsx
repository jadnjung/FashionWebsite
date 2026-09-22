import type { Metadata } from 'next';
import { ArchiveIndex } from '@/components/archive/ArchiveIndex';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Archive — Esque',
  description: 'Past Esque collections.',
  path: '/archive',
});

// See docs/superpowers/specs/2026-09-23-archive-design.md's "Build-time
// safety" section: without this, Next.js would try to statically prerender
// this page at build time (no searchParams/dynamic segment to force
// per-request rendering the way category pages get it for free), which
// would call getArchivedCollections() — and, deliberately, this route does
// NOT swallow its Shopify error the way getSelectedPieces does — during
// `pnpm build` itself. In this dev/CI environment (Shopify unconfigured),
// that throws, which would fail the production build rather than correctly
// deferring the failure to a runtime error boundary. This makes per-request
// rendering explicit, matching category pages' real, already-proven-safe
// behavior.
export const dynamic = 'force-dynamic';

export default function ArchivePage() {
  return <ArchiveIndex />;
}
