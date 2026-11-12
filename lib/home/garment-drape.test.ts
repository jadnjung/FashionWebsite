import { describe, expect, test } from 'vitest';
import {
  clothHalfThickness,
  drapeOffset,
  isInsidePolygon,
  seedFromString,
  signedDistanceToPolygon,
  silhouetteMask,
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

describe('silhouetteMask', () => {
  test('is opaque inside, transparent outside, with row 0 at the bottom', () => {
    const triangle: Point[] = [
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];
    const mask = silhouetteMask(triangle, BOUNDS, 8, 8, 0);
    expect(mask[0]).toBe(1); // bottom-left
    expect(mask[7 * 8 + 7]).toBe(0); // top-right
  });

  test('places the half-opacity edge `inset` inside the true outline', () => {
    // Square edge at x = 0.5; 40 texels across 2 units = 0.05 per texel.
    // Texel 29's center is x = 0.475, i.e. 0.025 inside the edge.
    expect(silhouetteMask(SQUARE, BOUNDS, 40, 1, 0)[29]).toBeCloseTo(1);
    expect(silhouetteMask(SQUARE, BOUNDS, 40, 1, 0.025)[29]).toBeCloseTo(0.5);
  });
});

describe('signedDistanceToPolygon', () => {
  test('is positive inside, negative outside, and zero on the edge', () => {
    expect(signedDistanceToPolygon(0, 0, SQUARE)).toBeCloseTo(0.5);
    expect(signedDistanceToPolygon(0.4, 0, SQUARE)).toBeCloseTo(0.1);
    expect(signedDistanceToPolygon(0.8, 0, SQUARE)).toBeCloseTo(-0.3);
    expect(signedDistanceToPolygon(0.5, 0.2, SQUARE)).toBeCloseTo(0);
  });

  test('measures to the nearest corner outside a convex corner', () => {
    expect(signedDistanceToPolygon(0.8, 0.9, SQUARE)).toBeCloseTo(-0.5);
  });
});

describe('clothHalfThickness', () => {
  test('is exactly zero on the outline, so front and back surfaces meet there', () => {
    expect(clothHalfThickness(0, 0.05, 0.1)).toBe(0);
  });

  test('is positive everywhere inside, reaching full thickness at the ramp width', () => {
    expect(clothHalfThickness(0.001, 0.05, 0.1)).toBeGreaterThan(0);
    expect(clothHalfThickness(0.05, 0.05, 0.1)).toBeGreaterThan(0.03);
    expect(clothHalfThickness(0.1, 0.05, 0.1)).toBe(0.05);
    expect(clothHalfThickness(0.4, 0.05, 0.1)).toBe(0.05);
  });

  test('continues smoothly negative outside (surfaces cross at the edge, not before it)', () => {
    const slope = clothHalfThickness(0.0001, 0.05, 0.1) / 0.0001;
    expect(clothHalfThickness(-0.01, 0.05, 0.1)).toBeCloseTo(-0.01 * slope, 4);
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
