'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Baseline error-boundary practice: surface the caught error somewhere
  // observable (the console) rather than silently discarding it — this
  // component previously destructured `error` in its type signature but
  // never read it.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-display-l text-esque-text">SOMETHING WENT WRONG.</h1>
      <Button variant="secondary" onClick={reset}>
        Retry
      </Button>
    </main>
  );
}
