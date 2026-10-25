import { describe, expect, test } from 'vitest';
import {
  DEMO_REGION_SHAPES,
  REGION_SHAPES,
} from '@/components/interactive-model/SilhouetteIllustration';

// These two shape tables are hand-authored percentage data (box position +
// clip-path polygon), not behavior — see SilhouetteIllustration.tsx's
// comment blocks for what each one is calibrated against and why they
// differ (abstract placeholder vs. the real Demo Mode photo). A test can't
// verify visual alignment to the photo (that was verified separately, live,
// per the task that added DEMO_REGION_SHAPES); what it *can* catch is a
// future edit introducing a malformed clip-path string or an
// out-of-bounds/NaN percentage, for either shape table.

function parsePercent(value: string): number {
  const match = /^(-?\d+(?:\.\d+)?)%$/.exec(value.trim());
  expect(match, `expected a "<number>%" string, got "${value}"`).not.toBeNull();
  return Number(match![1]);
}

function parsePolygonPoints(clipPath: string): Array<[number, number]> {
  const match = /^polygon\((.+)\)$/.exec(clipPath.trim());
  expect(match, `expected "polygon(...)", got "${clipPath}"`).not.toBeNull();
  return match![1].split(',').map((pair) => {
    const [x, y] = pair.trim().split(/\s+/);
    expect(x, `malformed point "${pair}" in "${clipPath}"`).toBeDefined();
    expect(y, `malformed point "${pair}" in "${clipPath}"`).toBeDefined();
    return [parsePercent(x), parsePercent(y)];
  });
}

describe.each([
  ['REGION_SHAPES (abstract placeholder)', REGION_SHAPES],
  ['DEMO_REGION_SHAPES (real photo)', DEMO_REGION_SHAPES],
])('%s', (_label, shapes) => {
  test.each(Object.entries(shapes))('%s box is within 0-100%% bounds', (_region, shape) => {
    const top = parsePercent(shape.box.top);
    const left = parsePercent(shape.box.left);
    const width = parsePercent(shape.box.width);
    const height = parsePercent(shape.box.height);

    for (const value of [top, left, width, height]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    expect(top + height).toBeLessThanOrEqual(100);
    expect(left + width).toBeLessThanOrEqual(100);
  });

  test.each(Object.entries(shapes))(
    '%s clip-path is a valid polygon() with in-bounds points',
    (_region, shape) => {
      const points = parsePolygonPoints(shape.clipPath);

      // A real silhouette, not a degenerate line/point.
      expect(points.length).toBeGreaterThanOrEqual(3);
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      }
    },
  );
});

describe('REGION_SHAPES vs DEMO_REGION_SHAPES', () => {
  test('both shape tables cover the same set of regions', () => {
    expect(Object.keys(DEMO_REGION_SHAPES).sort()).toEqual(Object.keys(REGION_SHAPES).sort());
  });
});
