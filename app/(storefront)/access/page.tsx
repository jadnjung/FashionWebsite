import type { Metadata } from 'next';
import { RequestAccessForm } from './RequestAccessForm';
import { buildPageMetadata } from '@/lib/seo/metadata';

// Real, indexable content now — no gate purpose left to hide (the
// whole-site password gate this route previously supported is deleted).
// Genuine, evergreen, useful content: "join the list for early access to
// future drops."
export const metadata: Metadata = buildPageMetadata({
  title: 'Request Access — Esque',
  description: 'Join the list for early access to future Esque drops.',
  path: '/access',
});

export default function AccessPage() {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="font-display text-display-l tracking-display text-esque-text">ESQUE</h1>
      <p className="max-w-xs text-utility uppercase tracking-metadata text-esque-text-secondary">
        EARLY ACCESS TO FUTURE DROPS.
      </p>
      <RequestAccessForm />
    </div>
  );
}
