import { getStorefrontClient, toRequestError } from '@/lib/shopify/client';
import { getPreviewLooks } from '@/lib/shopify/preview-demo-fixtures';
import { GET_LOOKS_QUERY } from '@/lib/shopify/queries/looks';
import { toProductDetail, type ProductDetail, type ProductImage } from '@/lib/shopify/products';

/** A curated outfit for the homepage "Shop the Look" ring (DECISIONS.md D-091). */
export interface Look {
  handle: string;
  /** The look's own title from Shopify, if set ("Look 03"); the UI numbers looks by position otherwise. */
  title: string | null;
  image: ProductImage | null;
  products: ProductDetail[];
}

export const MAX_LOOKS = 9;

/**
 * Fetches the curated looks — Shopify metaobjects of type "look", in the
 * Storefront API's default order. A product reference the Storefront can't
 * see (unpublished, deleted) arrives as a non-product node and is dropped;
 * a look left with no products is dropped too, since there'd be nothing to
 * shop. A look with no photo of its own falls back to its first product's
 * image. Throws on a real request error, like the other lib/shopify
 * fetchers — callers isolate it.
 */
export async function getLooks(first = MAX_LOOKS): Promise<Look[]> {
  // Demo Mode short-circuit — see preview-demo-fixtures.ts and D-057.
  if (process.env.PREVIEW_DEMO_MODE === '1') return getPreviewLooks().slice(0, first);

  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_LOOKS_QUERY, { variables: { first } });
  if (errors) throw toRequestError(errors);

  const looks: Look[] = [];
  for (const node of data?.metaobjects.nodes ?? []) {
    const products = (node.products?.references?.nodes ?? [])
      .filter((reference) => 'handle' in reference)
      .map(toProductDetail);
    if (products.length === 0) continue;

    const image = node.image?.reference?.image;
    looks.push({
      handle: node.handle,
      title: node.title?.value?.trim() || null,
      image: image
        ? {
            url: image.url,
            altText: image.altText ?? null,
            width: image.width ?? null,
            height: image.height ?? null,
          }
        : (products[0]?.images[0] ?? null),
      products,
    });
  }
  return looks;
}
