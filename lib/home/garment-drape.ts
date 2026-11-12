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
 * Rasterizes a closed polygon into a coverage field (0 outside, 1 inside,
 * fractional along the edge via `supersample`² samples per pixel) over
 * `bounds`. Row 0 is the bottom (minY), matching texture/UV orientation.
 */
export function rasterizePolygon(
  polygon: readonly Point[],
  bounds: Bounds,
  width: number,
  height: number,
  supersample = 2,
): Float32Array {
  const field = new Float32Array(width * height);
  const cellW = (bounds.maxX - bounds.minX) / width;
  const cellH = (bounds.maxY - bounds.minY) / height;
  const samples = supersample * supersample;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      let hits = 0;
      for (let sy = 0; sy < supersample; sy++) {
        for (let sx = 0; sx < supersample; sx++) {
          const x = bounds.minX + (col + (sx + 0.5) / supersample) * cellW;
          const y = bounds.minY + (row + (sy + 0.5) / supersample) * cellH;
          if (isInsidePolygon(x, y, polygon)) hits++;
        }
      }
      field[row * width + col] = hits / samples;
    }
  }
  return field;
}

/**
 * Separable box blur, repeated `passes` times (three passes approximate a
 * Gaussian). Used to turn the hard silhouette into a soft "distance from
 * the edge" field, so the cloth swells smoothly from a thin edge to its
 * full thickness instead of having slab-like sides. Edges clamp.
 */
export function blurField(
  field: Float32Array,
  width: number,
  height: number,
  radius: number,
  passes = 3,
): Float32Array {
  let current = Float32Array.from(field);
  const scratch = new Float32Array(field.length);
  const span = radius * 2 + 1;
  for (let pass = 0; pass < passes; pass++) {
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        let sum = 0;
        for (let k = -radius; k <= radius; k++) {
          const c = Math.min(width - 1, Math.max(0, col + k));
          sum += current[row * width + c]!;
        }
        scratch[row * width + col] = sum / span;
      }
    }
    const next = new Float32Array(field.length);
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        let sum = 0;
        for (let k = -radius; k <= radius; k++) {
          const r = Math.min(height - 1, Math.max(0, row + k));
          sum += scratch[r * width + col]!;
        }
        next[row * width + col] = sum / span;
      }
    }
    current = next;
  }
  return current;
}

/** Bilinear sample of a field at fractional texel coordinates (clamped). */
export function sampleField(
  field: Float32Array,
  width: number,
  height: number,
  u: number,
  v: number,
): number {
  const x = Math.min(width - 1, Math.max(0, u * width - 0.5));
  const y = Math.min(height - 1, Math.max(0, v * height - 0.5));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const top = field[y0 * width + x0]! * (1 - fx) + field[y0 * width + x1]! * fx;
  const bottom = field[y1 * width + x0]! * (1 - fx) + field[y1 * width + x1]! * fx;
  return top * (1 - fy) + bottom * fy;
}

/**
 * Half-thickness of the cloth at a point, from the blurred silhouette
 * value there: zero at (and outside) the silhouette edge, where the
 * blurred field is ~0.5, rising smoothly to `maxHalfThickness` inside.
 */
export function clothHalfThickness(blurred: number, maxHalfThickness: number): number {
  const t = Math.min(1, Math.max(0, (blurred - 0.5) / 0.5));
  // Sine ease: a rounded, padded edge rather than a wedge, but with a
  // finite slope at the rim — a square-root profile's near-vertical edge
  // turns into a hard, dark band on the side facing away from the light.
  return maxHalfThickness * Math.sin((t * Math.PI) / 2);
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
