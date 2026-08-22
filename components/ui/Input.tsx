import type { InputHTMLAttributes, Ref } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  ref?: Ref<HTMLInputElement>;
}

// Mirrors Button.tsx's focusRing constant — DESIGN_SYSTEM.md §22 / PROJECT.md
// §78's visible-focus requirement applies to every interactive element, not
// just buttons. --color-esque-text per DECISIONS.md D-010's contrast ruling.
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text';

// Deferred since ROADMAP.md Phase 1 ("no real consumer exists until Phase
// 4/6/10's search, request-access, and account forms") — the access
// gate's password/first-name/email fields (Phase 6) are that consumer.
export function Input({ label, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-2 text-left">
      <label
        htmlFor={inputId}
        className="text-utility tracking-metadata uppercase text-esque-text-secondary"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-none border border-esque-text-secondary bg-transparent px-4 py-3 text-body text-esque-text transition-colors duration-200 ease-esque focus:border-esque-text ${focusRing} ${className}`.trim()}
        {...props}
      />
    </div>
  );
}
