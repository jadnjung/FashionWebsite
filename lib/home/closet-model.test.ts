import { describe, expect, test } from 'vitest';
import { fitModelToHanger, type Vec3 } from '@/lib/home/closet-model';

function apply(point: Vec3, fit: ReturnType<typeof fitModelToHanger>): Vec3 {
  return {
    x: point.x * fit.scale + fit.offset.x,
    y: point.y * fit.scale + fit.offset.y,
    z: point.z * fit.scale + fit.offset.z,
  };
}

describe('fitModelToHanger', () => {
  // A coat authored in centimetres, off-center — like a raw export.
  const min = { x: 89, y: -40, z: 0 };
  const max = { x: 151, y: 57, z: 30 };

  test('places the top-center of an off-center model at the hanger point', () => {
    const fit = fitModelToHanger(min, max, 1, 1.2, -0.16);
    const topCenter = apply({ x: 120, y: 57, z: 15 }, fit);
    expect(topCenter.x).toBeCloseTo(0);
    expect(topCenter.y).toBeCloseTo(-0.16);
    expect(topCenter.z).toBeCloseTo(0);
  });

  test('scales uniformly to fit inside the hanger box, whatever the authored units', () => {
    const fit = fitModelToHanger(min, max, 1, 1.2, -0.16);
    const width = (max.x - min.x) * fit.scale;
    const height = (max.y - min.y) * fit.scale;
    expect(width).toBeLessThanOrEqual(1 + 1e-9);
    expect(height).toBeLessThanOrEqual(1.2 + 1e-9);
    expect(Math.max(width / 1, height / 1.2)).toBeCloseTo(1);
  });

  test('survives a degenerate (flat) box without dividing by zero', () => {
    const fit = fitModelToHanger({ x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }, 1, 1.2, 0);
    expect(Number.isFinite(fit.scale)).toBe(true);
  });
});
