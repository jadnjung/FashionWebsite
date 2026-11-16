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
/** Shopify cursors stay opaque. Demo cursors must identify a positive offset. */
export function getPaginationCursor(value: string | string[] | undefined): string | undefined {
  if (typeof value !== 'string' || !value || value.length > 4096) return undefined;
  if (process.env.PREVIEW_DEMO_MODE !== '1') return value;
  if (!/^preview:[1-9]\d*$/.test(value)) return undefined;
  return Number.isSafeInteger(Number(value.slice(8))) ? value : undefined;
}
