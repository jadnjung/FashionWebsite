// Honest scarcity display logic — DECISIONS.md D-028. Never fabricates: a
// null quantityAvailable (unconfigured store, or a real store that hasn't
// exposed it) always yields a null status here, never a guessed number.
// Thresholds (<=3 exact count, <=10 "low") are this pass's own reasoned
// interpretation of CONTENT.md §8's example vocabulary (LOW STOCK, "3
// REMAIN", SOLD OUT), not a value supplied by a merchandiser.

export type ScarcityStatus =
  { level: 'sold-out' } | { level: 'final'; count: number } | { level: 'low' } | null;

const FINAL_THRESHOLD = 3;
const LOW_STOCK_THRESHOLD = 10;

export function getScarcityStatus(
  quantityAvailable: number | null,
  availableForSale: boolean,
): ScarcityStatus {
  if (!availableForSale) return { level: 'sold-out' };
  if (quantityAvailable === null) return null;
  if (quantityAvailable <= 0) return { level: 'sold-out' };
  if (quantityAvailable <= FINAL_THRESHOLD) return { level: 'final', count: quantityAvailable };
  if (quantityAvailable <= LOW_STOCK_THRESHOLD) return { level: 'low' };
  return null;
}

/** Maps a status to CONTENT.md-vocabulary copy, kept separate so the copy itself is independently tested. */
export function getScarcityLabel(status: ScarcityStatus): string | null {
  if (!status) return null;
  switch (status.level) {
    case 'sold-out':
      return 'SOLD OUT';
    case 'final':
      return `${status.count} REMAIN`;
    case 'low':
      return 'LOW STOCK';
  }
}
