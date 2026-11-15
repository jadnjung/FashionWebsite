export const MIN_SEARCH_QUERY_LENGTH = 2;
export const MAX_SEARCH_QUERY_LENGTH = 100;

/** Preserve the entered characters, including composition, and trim only outer whitespace. */
export function normalizeSearchQuery(value: string): string {
  return value.trim();
}
