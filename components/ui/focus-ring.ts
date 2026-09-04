// Shared focus-visible treatment for every interactive UI primitive.
// DESIGN_SYSTEM.md §22's cursor/focus rules and PROJECT.md §78 both
// require a visible focus state on every interactive element, regardless
// of how restrained the resting visual style is. Extracted to its own
// module once a second primitive (Input) needed the identical rule —
// duplicating the literal class string per component risked the two
// silently drifting if the treatment ever changes.
export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-forest';
