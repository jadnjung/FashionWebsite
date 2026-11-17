export interface SearchCursors {
  productAfter?: string;
  collectionAfter?: string;
}

/** A new submission supplies only its query, clearing both group cursors. */
export function buildSearchHref(query: string, cursors: SearchCursors = {}): string {
  const params = new URLSearchParams({ q: query });
  if (cursors.productAfter) params.set('productAfter', cursors.productAfter);
  if (cursors.collectionAfter) params.set('collectionAfter', cursors.collectionAfter);
  return `/search?${params}`;
}
