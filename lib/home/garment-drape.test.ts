import { describe, expect, test } from 'vitest';
import {
  blurField,
  clothHalfThickness,
  drapeOffset,
  isInsidePolygon,
  rasterizePolygon,
  sampleField,
  seedFromString,
  type Point,
} from '@/lib/home/garment-drape';

const SQUARE: Point[] = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [0.5, 0.5],
  [-0.5, 0.5],
];
const BOUNDS = { minX: -1, maxX: 1, minY: -1, maxY: 1 };

describe('isInsidePolygon', () => {
  test('distinguishes inside from outside', () => {
    expect(isInsidePolygon(0, 0, SQUARE)).toBe(true);
    expect(isInsidePolygon(0.9, 0, SQUARE)).toBe(false);
  });
});

describe('rasterizePolygon', () => {
  test('covers the polygon fully inside, not at all outside, with row 0 at the bottom', () => {
    const triangle: Point[] = [
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];
    const field = rasterizePolygon(triangle, BOUNDS, 8, 8);
    expect(field[0]).toBe(1); // bottom-left
    expect(field[7 * 8 + 7]).toBe(0); // top-right
  });

  test('gives fractional coverage on an edge crossing a pixel', () => {
    const half: Point[] = [
      [-1, -1],
      [0.125, -1],
      [0.125, 1],
      [-1, 1],
    ];
    // Pixel 4 spans x 0..0.25; the edge at 0.125 halves it.
    const field = rasterizePolygon(half, BOUNDS, 8, 1, 4);
    expect(field[4]).toBeCloseTo(0.5);
  });
});

describe('blurField', () => {
  test('preserves a uniform field and softens a hard edge to ~0.5', () => {
    expect(Array.from(blurField(new Float32Array(16).fill(1), 4, 4, 1))).toEqual(
      new Array(16).fill(1),
    );
    const step = new Float32Array(20).map((_, i) => (i % 20 >= 10 ? 1 : 0));
    const blurred = blurField(step, 20, 1, 2);
    expect(blurred[0]).toBeCloseTo(0);
    expect(blurred[19]).toBeCloseTo(1);
    expect((blurred[9]! + blurred[10]!) / 2).toBeCloseTo(0.5, 1);
  });
});

describe('sampleField', () => {
  test('interpolates between texel centers', () => {
    const field = Float32Array.from([0, 1]);
    expect(sampleField(field, 2, 1, 0.5, 0.5)).toBeCloseTo(0.5);
    expect(sampleField(field, 2, 1, 0, 0.5)).toBe(0);
  });
});

describe('clothHalfThickness', () => {
  test('is zero at the silhouette edge and full deep inside', () => {
    expect(clothHalfThickness(0.5, 0.06)).toBe(0);
    expect(clothHalfThickness(0.2, 0.06)).toBe(0);
    expect(clothHalfThickness(1, 0.06)).toBe(0.06);
    expect(clothHalfThickness(0.75, 0.06)).toBeGreaterThan(0.03);
  });
});

describe('seedFromString', () => {
  test('is stable per input, in [0, 1), and differs between inputs', () => {
    const a = seedFromString('hoodie-01');
    expect(seedFromString('hoodie-01')).toBe(a);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
    expect(seedFromString('hoodie-02')).not.toBe(a);
  });
});

describe('drapeOffset', () => {
  test('folds deepen toward the hem: no fold variation at the shoulders', () => {
    const atTop = [0, 0.1, 0.2].map((x) => drapeOffset(x, 0, 0, 0.3));
    expect(new Set(atTop.map((z) => z.toFixed(6))).size).toBe(1);
    const atHem = [0, 0.1, 0.2].map((x) => drapeOffset(x, 1, 0, 0.3));
    expect(new Set(atHem.map((z) => z.toFixed(6))).size).toBeGreaterThan(1);
  });

  test('bows the front outward at the middle, not at the side edges', () => {
    expect(drapeOffset(0, 0, 0, 0)).toBeGreaterThan(drapeOffset(0, 0, 1, 0));
  });
});
