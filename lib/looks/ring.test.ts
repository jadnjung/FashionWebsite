import { describe, expect, test } from 'vitest';
import {
  MIN_LOOK_SCALE,
  closeness,
  frontIndex,
  lookScale,
  normalizeDegrees,
  relativeAngle,
  rotationForIndex,
  stepDegrees,
} from '@/lib/looks/ring';

describe('ring geometry', () => {
  test('spaces nine looks 40° apart', () => {
    expect(stepDegrees(9)).toBe(40);
    expect(stepDegrees(0)).toBe(0);
  });

  test('normalizes angles into (-180, 180]', () => {
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(-190)).toBe(170);
    expect(normalizeDegrees(180)).toBe(180);
    expect(normalizeDegrees(-180)).toBe(180);
  });

  test('look 0 faces the viewer at rotation 0; look 3 does after turning -120°', () => {
    expect(relativeAngle(0, 9, 0)).toBe(0);
    expect(relativeAngle(3, 9, -120)).toBe(0);
  });

  test('the front look is biggest and the back one smallest', () => {
    expect(closeness(0, 9, 0)).toBeCloseTo(1);
    expect(lookScale(0, 9, 0)).toBeCloseTo(1);
    // With 9 looks none sits exactly behind; the farthest is 160° away.
    const scales = Array.from({ length: 9 }, (_, i) => lookScale(i, 9, 0));
    expect(Math.max(...scales)).toBe(scales[0]);
    expect(Math.min(...scales)).toBeGreaterThanOrEqual(MIN_LOOK_SCALE);
    expect(scales[4]).toBeLessThan(scales[1]!);
  });

  test('frontIndex finds the nearest look, wrapping in both directions', () => {
    expect(frontIndex(9, 0)).toBe(0);
    expect(frontIndex(9, -40)).toBe(1);
    expect(frontIndex(9, -55)).toBe(1);
    expect(frontIndex(9, 40)).toBe(8);
    expect(frontIndex(9, -400)).toBe(1);
  });

  test('rotationForIndex takes the short way round from the current rotation', () => {
    expect(rotationForIndex(1, 9, 0)).toBe(-40);
    // From -350° (look ~0 after nearly a full turn), look 1 is at -400°, not -40°.
    expect(rotationForIndex(1, 9, -350)).toBe(-400);
    expect(frontIndex(9, rotationForIndex(5, 9, 1234))).toBe(5);
  });
});
