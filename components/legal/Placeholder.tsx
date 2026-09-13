// Marks one specific fact within otherwise-real policy prose as still
// depending on an unresolved business/legal decision (shipping carrier,
// return window, governing jurisdiction, etc. — PROJECT.md §54/§101). A
// single shared component (rather than typing "[Placeholder — ...]" by
// hand at each call site) guarantees every open item in these five pages
// renders identically and stays trivially greppable
// (`<Placeholder>`) for whoever finalizes this content later.
//
// font-medium overrides <strong>'s default browser-bold rendering —
// DESIGN_SYSTEM.md §10 prefers Regular/Medium weight and calls out Bold as
// something to avoid outside large display type. The semantic <strong>
// element itself is kept regardless of visual weight, so screen readers
// still announce this as emphasized text.
export function Placeholder({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium">[Placeholder — {children}]</strong>;
}
