import type { Metadata } from 'next';
import { ArchiveIndex } from '@/components/archive/ArchiveIndex';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getPaginationCursor } from '@/lib/shopify/pagination';

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const after = getPaginationCursor((await searchParams).after);
  return buildPageMetadata({
    title: 'Archive — Esque',
    description: 'Past Esque collections.',
    path: `/archive${after ? `?${new URLSearchParams({ after })}` : ''}`,
  });
}

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

export default async function ArchivePage({ searchParams }: PageProps) {
  const after = getPaginationCursor((await searchParams).after);
  return <ArchiveIndex after={after} />;
}
