/**
 * Demo Mode fixtures — an opt-in, off-by-default stand-in for real Shopify
 * data, gated on `PREVIEW_DEMO_MODE=1` (see this file's two call sites in
 * products.ts). Exists solely so the project owner or another stakeholder
 * can preview the built layout against real photography instead of the
 * sitewide "ESQUE PLACEHOLDER" text markers (DESIGN_SYSTEM.md §65),
 * without a real Shopify store — a stakeholder-preview convenience, never
 * a production fallback.
 *
 * Off by default everywhere: unset in local dev unless a developer
 * deliberately adds it to their own .env.local, never set in
 * playwright.config.ts's webServer.env or .github/workflows/ci.yml, and
 * not set in any real deployment unless someone deliberately configures
 * it there. See DECISIONS.md D-057 for the full reasoning, including how
 * this reconciles with D-012/D-023/D-026/D-033's precedent of never
 * fabricating Shopify data on a real page.
 *
 * Images: public/preview-demo/*.jpg — free-license Unsplash stock photos.
 * See public/preview-demo/SOURCES.md for licensing detail and per-file
 * provenance, including a known caveat about identifiable people in
 * several of these photos.
 */
import type { ProductDetail, ProductListItem } from '@/lib/shopify/products';

const IMG = (file: string, w: number, h: number) => ({
  url: `/preview-demo/${file}`,
  altText:
    'Free-license stock photo, temporary preview placeholder — not final product photography.',
  width: w,
  height: h,
});

export const PREVIEW_PRODUCTS: ProductListItem[] = [
  {
    id: 'preview-1',
    handle: 'preview-featherweight-crewneck',
    title: 'Featherweight Crewneck Sweater',
    productType: 'Sweaters',
    tags: [],
    minPrice: { amount: '128.00', currencyCode: 'USD' },
    availableForSale: true,
    images: [IMG('product-3.jpg', 900, 1125)],
  },
  {
    id: 'preview-2',
    handle: 'preview-tailored-trouser-set',
    title: 'Tailored Wide-Leg Trouser Set',
    productType: 'Trousers',
    tags: [],
    minPrice: { amount: '188.00', currencyCode: 'USD' },
    availableForSale: true,
    images: [IMG('product-4.jpg', 900, 1125)],
  },
  {
    id: 'preview-3',
    handle: 'preview-fluid-knit-long-sleeve',
    title: 'Fluid Knit Long-Sleeve',
    productType: 'Shirts',
    tags: [],
    minPrice: { amount: '96.00', currencyCode: 'USD' },
    availableForSale: true,
    images: [IMG('product-5.jpg', 900, 1125)],
  },
  {
    id: 'preview-4',
    handle: 'preview-silk-cami-layer',
    title: 'Silk Cami Layering Top',
    productType: 'T-Shirts',
    tags: [],
    minPrice: { amount: '84.00', currencyCode: 'USD' },
    availableForSale: true,
    images: [IMG('product-6.jpg', 900, 1125)],
  },
  {
    id: 'preview-5',
    handle: 'preview-relaxed-linen-trouser',
    title: 'Relaxed Linen Trouser',
    productType: 'Trousers',
    tags: [],
    minPrice: { amount: '142.00', currencyCode: 'USD' },
    availableForSale: false,
    images: [IMG('product-1.jpg', 900, 1125)],
  },
  {
    id: 'preview-6',
    handle: 'preview-velvet-evening-jacket',
    title: 'Velvet Evening Jacket',
    productType: 'Jackets',
    tags: [],
    minPrice: { amount: '236.00', currencyCode: 'USD' },
    availableForSale: true,
    images: [IMG('product-2.jpg', 900, 1125)],
  },
];

/**
 * Looks up one fixture product by handle for the Demo Mode-gated PDP path
 * (products.ts's getProduct). Returns null for an unrecognized handle,
 * mirroring getProduct's real not-found contract — a Demo Mode PDP request
 * for an unknown handle still renders the real "THIS PIECE DOESN'T
 * EXIST." UI rather than a special-cased error, the same honest-absence
 * behavior DECISIONS.md D-026 established for the real Shopify path.
 */
export function getPreviewProductDetail(handle: string): ProductDetail | null {
  const item = PREVIEW_PRODUCTS.find((p) => p.handle === handle);
  if (!item) return null;
  return {
    id: item.id,
    handle: item.handle,
    title: item.title,
    description:
      'Temporary preview placeholder description (free-license stock photography, not final product copy).',
    productType: item.productType,
    tags: item.tags,
    minPrice: item.minPrice,
    images: item.images,
    options: [
      { id: 'opt-size', name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] },
      { id: 'opt-color', name: 'Color', values: ['Black', 'Ecru'] },
    ],
    variants: [
      {
        id: `${item.id}-variant-1`,
        title: 'M / Black',
        availableForSale: item.availableForSale,
        quantityAvailable: item.availableForSale ? 8 : 0,
        price: item.minPrice,
        selectedOptions: [
          { name: 'Size', value: 'M' },
          { name: 'Color', value: 'Black' },
        ],
      },
    ],
  };
}
