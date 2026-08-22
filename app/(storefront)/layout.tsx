import { ShellClient } from '@/components/navigation/ShellClient';

// The shell (Header/FullScreenMenu/Footer) lives here, not in the root
// layout — app/(access) needs to render without it (ARCHITECTURE.md §6),
// and Next.js layouts are additive (a child segment can't opt out of a
// parent's layout), so the shell must sit in its own route group rather
// than the root.
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <ShellClient>{children}</ShellClient>;
}
