'use client';

// Placeholder — replaced in full by Task 5. Exists now only so AccessForm's
// import resolves for this task's own test/typecheck/build/E2E validation.
export function RequestAccessForm({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack}>
      Back
    </button>
  );
}
