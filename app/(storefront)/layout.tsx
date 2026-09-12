import { Footer } from '@/components/navigation/Footer';
import { ShellClient } from '@/components/navigation/ShellClient';

// The shell (Header/FullScreenMenu/Footer) lives here, not in the root
// layout — app/(access) needs to render without it (ARCHITECTURE.md §6),
// and Next.js layouts are additive (a child segment can't opt out of a
// parent's layout), so the shell must sit in its own route group rather
// than the root.
//
// Footer is rendered here (a Server Component) and passed to ShellClient as
// a prop, rather than ShellClient importing it directly — DECISIONS.md
// D-046. Footer has no interactivity, so this keeps its markup out of the
// client bundle entirely; only its already-server-rendered output crosses
// into the client tree, the same slot pattern `children` already uses here.
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <ShellClient footer={<Footer />}>{children}</ShellClient>;
}
