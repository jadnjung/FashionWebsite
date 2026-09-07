/**
 * Formats a Shopify Money-shaped value ({amount, currencyCode}) as a
 * localized currency string, e.g. {amount: '180.00', currencyCode: 'USD'}
 * -> '$180.00'. Extracted from ProductPurchasePanel (Phase 5) so the
 * Interactive Model's info panel and Shop the Look panel (Phase 8) reuse
 * the exact same logic instead of a second/third copy.
 */
export function formatPrice(price: { amount: string; currencyCode: string }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currencyCode,
  }).format(Number(price.amount));
}
