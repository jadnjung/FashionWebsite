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
import type { CollectionDetail, CollectionSummary } from '@/lib/shopify/collections';
import type { ProductDetail, ProductListItem, ProductSummary } from '@/lib/shopify/products';

const IMG = (file: string, w: number, h: number) => ({
  url: `/preview-demo/${file}`,
  altText:
    'Free-license stock photo, temporary preview placeholder — not final product photography.',
  width: w,
  height: h,
});

const PREVIEW_DESCRIPTION =
  'Temporary preview placeholder description (free-license stock photography, not final product copy).';

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
    description: PREVIEW_DESCRIPTION,
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

// Archive Demo Mode fixtures (ROADMAP.md Phase 11) — collections.ts's
// getCollection/getCollections and products.ts's getProductsByCollection
// are these fixtures' first real consumers, so both a current (non-
// archived) and an archived collection are modeled here: 'collection-001'
// proves the real "exists but isn't archived -> not found" branch
// (lib/archive/collections.ts's getArchivedCollection) actually excludes
// something even under Demo Mode, and 'collection-000' is the one that
// populates /archive and /archive/[handle].
export const PREVIEW_COLLECTIONS: CollectionSummary[] = [
  {
    id: 'preview-collection-current',
    handle: 'collection-001',
    title: 'Collection 001',
    dropStatus: 'active',
    archivedAt: null,
  },
  {
    id: 'preview-collection-archived',
    handle: 'collection-000',
    title: 'Collection 000',
    dropStatus: 'archived',
    archivedAt: '2026-06-01T00:00:00Z',
  },
];

// Real product types from PROJECT.md §9's taxonomy (Jackets, Sweaters) —
// not invented categories. Reuses product-1.jpg/product-2.jpg (already
// used by two of PREVIEW_PRODUCTS above under different demo titles) —
// these are explicitly generic, licensed placeholder photos with no
// claimed 1:1 product identity, so reusing a file under a different demo
// title is consistent with their existing "temporary preview placeholder"
// framing (see this file's header comment and public/preview-demo/SOURCES.md).
const PREVIEW_ARCHIVE_PRODUCTS: ProductSummary[] = [
  {
    id: 'preview-archive-1',
    handle: 'preview-structured-wool-coat',
    title: 'Structured Wool Coat',
    productType: 'Jackets',
    tags: [],
    minPrice: { amount: '312.00', currencyCode: 'USD' },
    description: PREVIEW_DESCRIPTION,
    image: IMG('product-1.jpg', 900, 1125),
  },
  {
    id: 'preview-archive-2',
    handle: 'preview-ribbed-turtleneck',
    title: 'Ribbed Turtleneck',
    productType: 'Sweaters',
    tags: [],
    minPrice: { amount: '118.00', currencyCode: 'USD' },
    description: PREVIEW_DESCRIPTION,
    image: IMG('product-2.jpg', 900, 1125),
  },
];

/**
 * Looks up one fixture collection by handle for the Demo Mode-gated
 * Archive path (collections.ts's getCollection). Returns null for an
 * unrecognized handle, mirroring getCollection's real not-found contract.
 * 'collection-001' resolves to a real, current (non-archived) collection
 * deliberately — so that lib/archive/collections.ts's
 * getArchivedCollection('collection-001') under Demo Mode exercises the
 * same "exists but isn't archived, so still not found" path a real store
 * would produce, not a fixture set that only ever contains archived data.
 */
export function getPreviewCollectionDetail(handle: string): CollectionDetail | null {
  if (handle === 'collection-001') {
    return {
      id: 'preview-collection-current',
      handle: 'collection-001',
      title: 'Collection 001',
      description: 'The current Esque collection — available while it lasts.',
      dropStatus: 'active',
      dropDate: null,
      archivedAt: null,
      products: PREVIEW_PRODUCTS.map((p) => ({ id: p.id, handle: p.handle, title: p.title })),
      hasNextPage: false,
      endCursor: null,
    };
  }
  if (handle === 'collection-000') {
    return {
      id: 'preview-collection-archived',
      handle: 'collection-000',
      title: 'Collection 000',
      description: 'The collection that came before. No longer available.',
      dropStatus: 'archived',
      dropDate: null,
      archivedAt: '2026-06-01T00:00:00Z',
      products: PREVIEW_ARCHIVE_PRODUCTS.map((p) => ({
        id: p.id,
        handle: p.handle,
        title: p.title,
      })),
      hasNextPage: false,
      endCursor: null,
    };
  }
  return null;
}

/**
 * Looks up a fixture collection's product list by handle for the Demo
 * Mode-gated Archive path (products.ts's getProductsByCollection). Returns
 * null for an unrecognized handle, mirroring getProductsByCollection's
 * real not-found contract.
 */
export function getPreviewProductsByCollection(handle: string): ProductSummary[] | null {
  if (handle === 'collection-001') {
    return PREVIEW_PRODUCTS.map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      productType: p.productType,
      tags: p.tags,
      minPrice: p.minPrice,
      description: PREVIEW_DESCRIPTION,
      image: p.images[0] ?? null,
    }));
  }
  if (handle === 'collection-000') return PREVIEW_ARCHIVE_PRODUCTS;
  return null;
}
