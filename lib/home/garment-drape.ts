// Pure geometry math for the Collection Closet's placeholder cloth garments
// (DECISIONS.md D-089) — kept free of three.js and the DOM so it's
// unit-testable in this project's node vitest environment.

export type Point = readonly [number, number];

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Even-odd point-in-polygon test. */
export function isInsidePolygon(x: number, y: number, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Signed distance from (x, y) to the polygon's outline: positive inside,
 * negative outside, zero exactly on the edge.
 */
export function signedDistanceToPolygon(x: number, y: number, polygon: readonly Point[]): number {
  let nearest = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[j]!;
    const [bx, by] = polygon[i]!;
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t =
      lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSq));
    nearest = Math.min(nearest, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return isInsidePolygon(x, y, polygon) ? nearest : -nearest;
}

/**
 * The garment's cut-out mask, one value per texel over `bounds` (row 0 is
 * the bottom, minY, matching texture/UV orientation): 1 inside, 0 outside,
 * a one-texel antialiased ramp across the edge.
 *
 * Computed from the same signed distance as the cloth's thickness, so the
 * visible outline and the closed edge where front and back surfaces meet
 * always agree. The edge sits `inset` inside the true outline, so the cut
 * never exposes the sliver just beyond it where the two surfaces have
 * already crossed.
 */
export function silhouetteMask(
  polygon: readonly Point[],
  bounds: Bounds,
  width: number,
  height: number,
  inset: number,
): Float32Array {
  const mask = new Float32Array(width * height);
  const cellW = (bounds.maxX - bounds.minX) / width;
  const cellH = (bounds.maxY - bounds.minY) / height;
  const texel = Math.min(cellW, cellH);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const x = bounds.minX + (col + 0.5) * cellW;
      const y = bounds.minY + (row + 0.5) * cellH;
      const d = signedDistanceToPolygon(x, y, polygon);
      mask[row * width + col] = Math.min(1, Math.max(0, (d - inset) / texel + 0.5));
    }
  }
  return mask;
}

/**
 * Half-thickness of the cloth at a point `signedDistance` in from its
 * outline: exactly zero on the outline — so the front and back surfaces
 * meet there and the edge is closed, with no seam to see through — rising
 * along a sine ease to `maxHalfThickness` at `rampWidth` inside, for a
 * rounded, padded edge with a finite slope. Outside the outline it keeps
 * the same slope into negative values: the two surfaces cross exactly at
 * the edge rather than flattening together before it, so wherever a mesh
 * triangle straddles the edge, they still meet at the alpha cut-out.
 */
export function clothHalfThickness(
  signedDistance: number,
  maxHalfThickness: number,
  rampWidth: number,
): number {
  if (signedDistance >= rampWidth) return maxHalfThickness;
  if (signedDistance >= 0)
    return maxHalfThickness * Math.sin((signedDistance / rampWidth) * (Math.PI / 2));
  return maxHalfThickness * (Math.PI / 2) * (signedDistance / rampWidth);
}

/**
 * Small deterministic hash of a string to [0, 1), so each garment gets its
 * own stable fold pattern across renders and visits.
 */
export function seedFromString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

/**
 * Depth offset of hanging fabric at (x, y): soft vertical drape folds that
 * deepen toward the hem (gravity pulls cloth into folds below the
 * shoulders, which stay smooth over the hanger), plus a gentle front bow
 * across the width so the garment reads as wrapping a body-shaped hanger
 * rather than a flat board. `depth` is 0 at the top edge and 1 at the hem;
 * `across` is -1..1 from left to right edge.
 */
export function drapeOffset(x: number, depth: number, across: number, seed: number): number {
  const gravity = Math.pow(Math.min(1, Math.max(0, depth)), 1.4);
  const phase = seed * Math.PI * 2;
  const folds =
    0.024 * Math.sin(x * 23 + phase) + 0.008 * Math.sin(x * 41 + phase * 2.3 + depth * 1.5);
  const bow = 0.05 * (1 - across * across) * (1 - 0.4 * depth);
  return gravity * folds + bow;
}
