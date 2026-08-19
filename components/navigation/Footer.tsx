import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-esque-surface bg-esque-black px-4 py-8 text-utility text-esque-text-secondary md:px-8">
      <nav aria-label="Legal and support" className="flex flex-wrap gap-4 -my-2">
        {/* WCAG 2.2 AA (2.5.8): each link's clickable area needs to be at
            least 24x24px. Plain inline text at text-utility (13px) rendered
            ~20px tall with no padding — `inline-block py-2` grows the
            target without changing the visible text size; the negative
            vertical margin on the nav (matching py-2's 8px) offsets the
            added padding so the row's overall footprint looks the same as
            before. Only vertical margin is negated since only vertical
            padding was added — a symmetric `-m-2` would also shift the row
            8px horizontally for no reason. */}
        <Link href="/legal/privacy" className="inline-block py-2 hover:text-esque-text">
          Privacy
        </Link>
        <Link href="/legal/terms" className="inline-block py-2 hover:text-esque-text">
          Terms
        </Link>
        <Link href="/contact" className="inline-block py-2 hover:text-esque-text">
          Contact
        </Link>
      </nav>
    </footer>
  );
}
