import { expect, test } from 'vitest';
import { getSyntheticSizeChart, formatMeasurement } from './size-guide';

const options = [{ id: 's', name: 'Size', values: ['XS', 'M', 'XL'] }];
test('synthetic garment charts follow type and actual option labels', () => {
  const top = getSyntheticSizeChart('preview-top', 'Sweaters', options);
  const bottom = getSyntheticSizeChart('preview-bottom', 'Trousers', options);
  expect(top?.measurements.map((measurement) => measurement.label)).toEqual(['Chest', 'Length']);
  expect(bottom?.measurements.map((measurement) => measurement.label)).toEqual(['Waist', 'Inseam']);
  expect(bottom?.rows.map((row) => row.size)).toEqual(['XS', 'M', 'XL']);
  expect(bottom?.basis).toBe('garment');
});
test('missing and production charts remain absent', () => {
  expect(getSyntheticSizeChart('live-top', 'Sweaters', options)).toBeNull();
  expect(getSyntheticSizeChart('preview-bag', 'Bags', options)).toBeNull();
  expect(getSyntheticSizeChart('preview-top', 'Sweaters', [])).toBeNull();
});
test('unit switching always converts from original inches', () => {
  expect(formatMeasurement(38, 'in')).toBe('38');
  expect(formatMeasurement(38, 'cm')).toBe('96.5');
  expect(formatMeasurement(38, 'in')).toBe('38');
});
