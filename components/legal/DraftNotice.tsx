import Link from 'next/link';

// Shown at the top of every draft legal/policy page (Privacy, Terms,
// Shipping, Returns, Refunds — NOT the Accessibility Statement, which
// describes real, present-tense engineering work rather than unresolved
// business/legal decisions; see DECISIONS.md D-054).
//
// This is real, load-bearing content, not filler: PROJECT.md §85 states
// outright that "exact legal language should be reviewed against Esque's
// finalized business operations and relevant U.S. laws" before launch, and
// PROJECT.md §54/§101 list shipping carrier/rates and return window as
// still-open decisions. Publishing these pages without a visible,
// unambiguous draft notice would risk a reasonable visitor mistaking
// placeholder legal content for a final, binding policy. A bordered block
// (rather than inline text) makes it impossible to skim past, matching how
// DESIGN_SYSTEM.md §65's "ESQUE PLACEHOLDER" convention already makes
// undecided photography impossible to mistake for final art.
export function DraftNotice() {
  return (
    <div className="border border-esque-text-secondary bg-esque-surface px-4 py-4 md:px-6">
      <p className="pb-2 text-utility uppercase tracking-metadata text-esque-text-secondary">
        Draft — Not Yet Final
      </p>
      <p className="text-body text-esque-text">
        This page describes Esque&apos;s intended policy while Collection 001 is in development. It
        has not been reviewed by legal counsel and will be finalized before launch, once
        Esque&apos;s business operations and applicable law are confirmed. Sections still depending
        on an open decision are marked <strong className="font-medium">[Placeholder]</strong>.
        Questions in the meantime can be directed to{' '}
        <Link
          href="/contact"
          className="underline underline-offset-4 hover:text-esque-text-secondary"
        >
          Contact
        </Link>
        .
      </p>
    </div>
  );
}
