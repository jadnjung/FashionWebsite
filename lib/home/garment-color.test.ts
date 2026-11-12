import { describe, expect, test } from 'vitest';
import { pickDominantColor, rgbToHex } from '@/lib/home/garment-color';

function image(width: number, height: number, pixel: (x: number, y: number) => number[]) {
  const data: number[] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.push(...pixel(x, y));
  return data;
}

describe('pickDominantColor', () => {
  test('returns the garment color in the center, ignoring the background around it', () => {
    const data = image(10, 10, (x, y) =>
      x >= 3 && x < 7 && y >= 3 && y < 7 ? [30, 60, 40, 255] : [240, 240, 240, 255],
    );
    expect(pickDominantColor(data, 10, 10)).toEqual({ r: 30, g: 60, b: 40 });
  });

  test('picks the most common garment color rather than averaging in a minority of skin pixels', () => {
    // Navy garment filling the center of a pale backdrop, with every fifth
    // garment pixel skin-toned (a neckline, hands).
    let n = 0;
    const data = image(20, 20, (x, y) => {
      if (x < 5 || x >= 15 || y < 5 || y >= 15) return [238, 236, 230, 255];
      return n++ % 5 === 0 ? [225, 180, 150, 255] : [20, 30, 70, 255];
    });
    expect(pickDominantColor(data, 20, 20)).toEqual({ r: 20, g: 30, b: 70 });
  });

  test('prefers the garment over a backdrop that fills most of the center', () => {
    // Pale studio sweep everywhere; a dark outfit covering a quarter of the
    // central window.
    const data = image(20, 20, (x, y) =>
      x >= 8 && x < 12 && y >= 6 && y < 14 ? [25, 25, 28, 255] : [235, 233, 228, 255],
    );
    expect(pickDominantColor(data, 20, 20)).toEqual({ r: 25, g: 25, b: 28 });
  });

  test('keeps a backdrop-colored garment when nothing else is substantial (white tee on white)', () => {
    const data = image(20, 20, (x, y) =>
      x === 10 && y === 10 ? [200, 30, 30, 255] : [240, 240, 240, 255],
    );
    expect(pickDominantColor(data, 20, 20)).toEqual({ r: 240, g: 240, b: 240 });
  });

  test('ignores transparent pixels and returns null when nothing is opaque', () => {
    expect(
      pickDominantColor(
        image(4, 4, () => [10, 10, 10, 0]),
        4,
        4,
      ),
    ).toBeNull();
  });
});

describe('rgbToHex', () => {
  test('formats and clamps channels', () => {
    expect(rgbToHex({ r: 31, g: 61, b: 43 })).toBe('#1f3d2b');
    expect(rgbToHex({ r: 300, g: -5, b: 0 })).toBe('#ff0000');
  });
});
