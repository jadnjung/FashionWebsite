'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-display-l text-esque-text">SOMETHING WENT WRONG.</h1>
      <button
        onClick={reset}
        className="border border-esque-text-secondary px-6 py-3 text-esque-text hover:border-esque-text"
      >
        Retry
      </button>
    </div>
  );
}
