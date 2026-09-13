import { describe, expect, test } from 'vitest';
import { buildBreadcrumbJsonLd, buildProductJsonLd } from '@/lib/seo/structured-data';
import type { ProductDetail, ProductVariant } from '@/lib/shopify/products';

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 'gid://shopify/ProductVariant/1',
    title: 'S / Black',
    availableForSale: true,
    quantityAvailable: 10,
    price: { amount: '120.00', currencyCode: 'USD' },
    selectedOptions: [{ name: 'Size', value: 'S' }],
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 'gid://shopify/Product/1',
    handle: 'hoodie-01',
    title: 'Hoodie 01',
    description: 'A hoodie.',
    productType: 'Hoodies',
    tags: [],
    minPrice: { amount: '120.00', currencyCode: 'USD' },
    images: [],
    options: [],
    variants: [makeVariant()],
    ...overrides,
  };
}

describe('buildProductJsonLd', () => {
  test('builds a Product schema from real, already-fetched fields', () => {
    const result = buildProductJsonLd(makeProduct());
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Hoodie 01',
      description: 'A hoodie.',
      url: 'http://localhost:3000/products/hoodie-01',
      offers: {
        '@type': 'Offer',
        url: 'http://localhost:3000/products/hoodie-01',
        priceCurrency: 'USD',
        price: '120.00',
        availability: 'https://schema.org/InStock',
      },
    });
  });

  test('omits image entirely when the product has no real photo, rather than fabricating one', () => {
    const result = buildProductJsonLd(makeProduct());
    expect(result).not.toHaveProperty('image');
  });

  test('includes image when the product has a real photo', () => {
    const result = buildProductJsonLd(
      makeProduct({
        images: [{ url: 'https://cdn.shopify.com/x.jpg', altText: null, width: 800, height: 800 }],
      }),
    );
    expect(result.image).toBe('https://cdn.shopify.com/x.jpg');
  });

  test('omits description when the product has none, rather than emitting an empty string', () => {
    const result = buildProductJsonLd(makeProduct({ description: '' }));
    expect(result).not.toHaveProperty('description');
  });

  test('reports OutOfStock when every variant is unavailable', () => {
    const result = buildProductJsonLd(
      makeProduct({ variants: [makeVariant({ availableForSale: false })] }),
    );
    expect(result.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  test('reports InStock when at least one variant is available', () => {
    const result = buildProductJsonLd(
      makeProduct({
        variants: [
          makeVariant({ availableForSale: false }),
          makeVariant({ availableForSale: true }),
        ],
      }),
    );
    expect(result.offers.availability).toBe('https://schema.org/InStock');
  });

  test('never fabricates review or aggregateRating — this codebase has no reviews feature', () => {
    const result = buildProductJsonLd(makeProduct());
    expect(result).not.toHaveProperty('review');
    expect(result).not.toHaveProperty('aggregateRating');
  });
});

describe('buildBreadcrumbJsonLd', () => {
  test('builds a positioned ListItem per item with absolute URLs', () => {
    const result = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'TOPS', path: '/tops' },
      { name: 'Hoodies', path: '/tops/hoodies' },
    ]);
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'http://localhost:3000/' },
        { '@type': 'ListItem', position: 2, name: 'TOPS', item: 'http://localhost:3000/tops' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Hoodies',
          item: 'http://localhost:3000/tops/hoodies',
        },
      ],
    });
  });

  test('positions are 1-indexed regardless of list length', () => {
    const result = buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }]);
    expect(result.itemListElement).toHaveLength(1);
    expect(result.itemListElement[0].position).toBe(1);
  });
});
