// Pure geometry for the homepage "Shop the Look" ring (DECISIONS.md D-091).
// The ring element is rotated by `rotation` degrees about its vertical
// axis; look i sits at `i * step` degrees on it. A look faces the viewer
// when its world angle (rotation + i·step) is a whole turn.

/** Smallest scale, for the look directly opposite the viewer. */
export const MIN_LOOK_SCALE = 0.62;

export function stepDegrees(count: number): number {
  return count > 0 ? 360 / count : 0;
}

/** Wraps an angle into (-180, 180]. */
export function normalizeDegrees(degrees: number): number {
  const wrapped = ((degrees % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

/** World angle of look `index`, relative to facing the viewer (0 = front). */
export function relativeAngle(index: number, count: number, rotation: number): number {
  return normalizeDegrees(rotation + index * stepDegrees(count));
}

/** 1 when a look faces the viewer, 0 when it's directly behind. */
export function closeness(index: number, count: number, rotation: number): number {
  const radians = (relativeAngle(index, count, rotation) * Math.PI) / 180;
  return (Math.cos(radians) + 1) / 2;
}

/** Scale for a look: largest at the front, smallest at the back. */
export function lookScale(index: number, count: number, rotation: number): number {
  return MIN_LOOK_SCALE + (1 - MIN_LOOK_SCALE) * closeness(index, count, rotation);
}

/** Index of the look currently nearest the front. */
export function frontIndex(count: number, rotation: number): number {
  if (count <= 0) return 0;
  const index = Math.round(-rotation / stepDegrees(count));
  return ((index % count) + count) % count;
}

/**
 * The rotation that brings look `index` to the front, choosing the
 * equivalent angle nearest `current` so the ring takes the short way round.
 */
export function rotationForIndex(index: number, count: number, current: number): number {
  const base = -index * stepDegrees(count);
  return base + Math.round((current - base) / 360) * 360;
}
