import type { ProductOption } from '@/lib/shopify/products';

export interface SizeChart {
  category: 'tops' | 'bottoms';
  basis: 'garment';
  sourceUnit: 'in';
  provisional: boolean;
  measurements: { label: string; instruction: string }[];
  rows: { size: string; values: number[] }[];
  note: string;
}

/** Demo-only values illustrate the chart interface. Live measurements require
 * a verified product-data source and deliberately have no inferred fallback. */
export function getSyntheticSizeChart(
  handle: string,
  productType: string,
  options: ProductOption[],
): SizeChart | null {
  if (!handle.startsWith('preview-')) return null;
  const sizes = options.find((option) => option.name.toLowerCase() === 'size')?.values;
  if (!sizes?.length) return null;
  const category = /trouser|pant|jean|short|bottom/i.test(productType)
    ? 'bottoms'
    : /shirt|sweater|crewneck|hoodie|jacket|top|knit/i.test(productType)
      ? 'tops'
      : null;
  if (!category) return null;
  return {
    category,
    basis: 'garment',
    sourceUnit: 'in',
    provisional: true,
    measurements:
      category === 'tops'
        ? [
            {
              label: 'Chest',
              instruction:
                'Lay the garment flat. Measure across the chest just below the armholes and double the width.',
            },
            { label: 'Length', instruction: 'Measure from the highest shoulder point to the hem.' },
          ]
        : [
            {
              label: 'Waist',
              instruction:
                'Lay the garment flat. Measure across the waistband without stretching and double the width.',
            },
            {
              label: 'Inseam',
              instruction: 'Measure from the crotch seam along the inside leg to the hem.',
            },
          ],
    rows: sizes.map((size, index) => ({
      size,
      values: category === 'tops' ? [36 + index * 2, 26 + index] : [28 + index * 2, 30 + index],
    })),
    note: 'Compare with a garment you already wear. Final product measurements are pending.',
  };
}

export function formatMeasurement(inches: number, unit: 'in' | 'cm'): string {
  return String(unit === 'in' ? inches : Math.round(inches * 2.54 * 10) / 10);
}
