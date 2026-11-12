/**
 * Pure interaction state for the homepage Collection Closet (DECISIONS.md
 * D-089), kept outside the WebGL components so it is unit-testable in
 * this project's DOM-less vitest environment.
 *
 * `hovered` is a transient preview (pointer over a garment, or keyboard
 * focus on its button); `selected` is the garment pulled off the rod.
 * While a garment is selected, hover changes are still recorded but the
 * stage ignores them — the rod is dimmed behind the focused piece.
 */
export interface ClosetState {
  hovered: string | null;
  selected: string | null;
}

export type ClosetAction =
  | { type: 'hover'; handle: string }
  | { type: 'unhover'; handle: string }
  | { type: 'select'; handle: string }
  | { type: 'dismiss' };

export const INITIAL_CLOSET_STATE: ClosetState = { hovered: null, selected: null };

export function closetReducer(state: ClosetState, action: ClosetAction): ClosetState {
  switch (action.type) {
    case 'hover':
      return state.hovered === action.handle ? state : { ...state, hovered: action.handle };
    case 'unhover':
      // Only clear when leaving the garment that is actually hovered — a
      // late pointer-out from the previous garment must not erase the next.
      return state.hovered === action.handle ? { ...state, hovered: null } : state;
    case 'select':
      return state.selected === action.handle ? state : { ...state, selected: action.handle };
    case 'dismiss':
      return state.selected === null ? state : { ...state, selected: null };
  }
}

/** Horizontal distance between neighbouring hangers, in scene units. */
export const HANGER_SPACING = 0.85;

/** X position of the hanger at `index` in a rod of `count`, centered on 0. */
export function getHangerX(index: number, count: number, spacing = HANGER_SPACING): number {
  return (index - (count - 1) / 2) * spacing;
}

/**
 * Clamps the camera's pan along the rod (mobile swipe) so it can never
 * scroll past the first or last hanger. When every hanger already fits in
 * view, panning is locked to center.
 */
export function clampRodPan(
  pan: number,
  count: number,
  visibleWidth: number,
  spacing = HANGER_SPACING,
): number {
  // Each end garment extends half a spacing beyond its hanger.
  const rodWidth = Math.max(0, count) * spacing;
  if (rodWidth <= visibleWidth) return 0;
  const maxPan = (rodWidth - visibleWidth) / 2;
  return Math.min(maxPan, Math.max(-maxPan, pan));
}
