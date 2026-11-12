export interface Rgb {
  r: number;
  g: number;
  b: number;
}

// The central window of a product photo — where the garment almost always
// sits in an on-model or flat-lay shot — sampled to guess its color.
const REGION_START = 0.3;
const REGION_END = 0.7;
// 4 bits per channel: coarse enough that one fabric's shading variations
// land in the same bucket, fine enough to separate it from skin/background.
const QUANT_SHIFT = 4;

// The photo's outer frame is assumed to be backdrop (studio sweep, wall,
// floor): this fraction of each edge is sampled to learn its color.
const BORDER = 0.08;
// A center color counts as "backdrop" within this RGB distance of it.
const BACKDROP_DISTANCE = 48;
// The best non-backdrop color must cover at least this share of the
// center to be trusted over the backdrop itself (e.g. a white tee shot on
// a white sweep legitimately *is* backdrop-colored).
const MIN_GARMENT_SHARE = 0.12;

interface Bucket {
  count: number;
  r: number;
  g: number;
  b: number;
}

function bucketKey(r: number, g: number, b: number): number {
  return ((r >> QUANT_SHIFT) << 8) | ((g >> QUANT_SHIFT) << 4) | (b >> QUANT_SHIFT);
}

function collectBuckets(
  rgba: ArrayLike<number>,
  width: number,
  include: (x: number, y: number) => boolean,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): { buckets: Map<number, Bucket>; total: number } {
  const buckets = new Map<number, Bucket>();
  let total = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (!include(x, y)) continue;
      const i = (y * width + x) * 4;
      if ((rgba[i + 3] ?? 0) < 128) continue;
      const r = rgba[i] ?? 0;
      const g = rgba[i + 1] ?? 0;
      const b = rgba[i + 2] ?? 0;
      const key = bucketKey(r, g, b);
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
      total += 1;
    }
  }
  return { buckets, total };
}

function averageOf(bucket: Bucket): Rgb {
  return {
    r: Math.round(bucket.r / bucket.count),
    g: Math.round(bucket.g / bucket.count),
    b: Math.round(bucket.b / bucket.count),
  };
}

function largest(buckets: Iterable<Bucket>): Bucket | null {
  let best: Bucket | null = null;
  for (const bucket of buckets) if (!best || bucket.count > best.count) best = bucket;
  return best;
}

function distance(a: Rgb, b: Rgb): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

/**
 * Picks a product photo's garment color from raw RGBA pixel data (a small
 * downscaled copy is enough) — the fallback fabric color for a placeholder
 * garment whose product has no Shopify color swatch (DECISIONS.md D-089).
 *
 * Looks at the photo's central window, where the garment almost always
 * sits, and returns the average of its most common quantized color — so a
 * few highlight/shadow pixels can't skew it the way a plain average would.
 * Colors matching the backdrop (learned from the photo's outer frame) are
 * skipped when a substantial non-backdrop color exists, so a dark outfit
 * shot against a pale studio sweep reads as the outfit, not the wall.
 * Null when there is nothing opaque to sample.
 */
export function pickDominantColor(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
): Rgb | null {
  const cx0 = Math.floor(width * REGION_START);
  const cx1 = Math.min(width, Math.max(cx0 + 1, Math.ceil(width * REGION_END)));
  const cy0 = Math.floor(height * REGION_START);
  const cy1 = Math.min(height, Math.max(cy0 + 1, Math.ceil(height * REGION_END)));
  const center = collectBuckets(rgba, width, () => true, cx0, cx1, cy0, cy1);
  const overall = largest(center.buckets.values());
  if (!overall) return null;

  const bx = Math.max(1, Math.round(width * BORDER));
  const by = Math.max(1, Math.round(height * BORDER));
  const border = collectBuckets(
    rgba,
    width,
    (x, y) => x < bx || x >= width - bx || y < by || y >= height - by,
    0,
    width,
    0,
    height,
  );
  const backdropBucket = largest(border.buckets.values());
  if (!backdropBucket) return averageOf(overall);
  const backdrop = averageOf(backdropBucket);

  const garment = largest(
    [...center.buckets.values()].filter(
      (bucket) => distance(averageOf(bucket), backdrop) > BACKDROP_DISTANCE,
    ),
  );
  if (garment && garment.count >= center.total * MIN_GARMENT_SHARE) return averageOf(garment);
  return averageOf(overall);
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}
