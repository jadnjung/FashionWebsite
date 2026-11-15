/** Deterministic Demo cursors mirror Shopify's exclusive-after connection contract. */
export function previewPage<T>(items: readonly T[], first: number, after?: string) {
  const offset = after && /^preview:\d+$/.test(after) ? Number(after.slice(8)) : 0;
  const limit = Math.min(250, Math.max(1, Math.floor(first)));
  const page = items.slice(offset, offset + limit);
  const hasNextPage = offset + page.length < items.length;
  return {
    items: page,
    hasNextPage,
    endCursor: page.length ? `preview:${offset + page.length}` : null,
  };
}
