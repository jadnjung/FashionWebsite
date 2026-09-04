import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-esque-surface bg-esque-black px-4 py-8 text-utility text-esque-text-secondary md:px-8">
      <nav aria-label="Legal and support" className="flex flex-wrap gap-4">
        <Link href="/legal/privacy" className="hover:text-esque-text">
          Privacy
        </Link>
        <Link href="/legal/terms" className="hover:text-esque-text">
          Terms
        </Link>
        <Link href="/contact" className="hover:text-esque-text">
          Contact
        </Link>
      </nav>
    </footer>
  );
}
