import { getPreviewProductDetail } from '@/lib/shopify/preview-demo-fixtures';
import {
  CartValidationError,
  cartLineInputs,
  DEMO_QUANTITY_LIMIT,
  parseCartLines,
  type CartOperation,
  type CartLine,
  type DemoCart,
} from '@/lib/cart/model';

export { parseCartLines } from '@/lib/cart/model';
export type { CartLineInput } from '@/lib/cart/model';

/** Stateless demo replacements are safe to retry. Shopify cart writes remain unbuilt. */
export function buildDemoCart(input: unknown): DemoCart {
  const grouped = new Map<string, CartLine>();
  for (const item of parseCartLines(input)) {
    const product = getPreviewProductDetail(item.handle);
    const variant = product?.variants.find((candidate) => candidate.id === item.variantId);
    if (!product || !variant?.availableForSale)
      throw new CartValidationError('variant_unavailable');
    if (variant.price.currencyCode !== 'USD' || !/^\d+\.\d{2}$/.test(variant.price.amount)) {
      throw new CartValidationError('invalid_cart');
    }
    const quantity = item.quantity + (grouped.get(item.variantId)?.quantity ?? 0);
    const quantityMax =
      variant.quantityAvailable != null && variant.quantityAvailable > 0
        ? Math.min(DEMO_QUANTITY_LIMIT, variant.quantityAvailable)
        : DEMO_QUANTITY_LIMIT;
    if (quantity > quantityMax) throw new CartValidationError('quantity_unavailable');
    const unitMinor = Number(variant.price.amount.replace('.', ''));
    if (!Number.isSafeInteger(unitMinor) || !Number.isSafeInteger(unitMinor * quantity)) {
      throw new CartValidationError('invalid_cart');
    }
    grouped.set(item.variantId, {
      ...item,
      quantity,
      quantityMax,
      title: product.title,
      image: product.images[0] ?? null,
      selectedOptions: variant.selectedOptions,
      unitPrice: variant.price,
      productMinPrice: product.minPrice,
      lineTotal: { amount: ((unitMinor * quantity) / 100).toFixed(2), currencyCode: 'USD' },
    });
  }
  const lines = [...grouped.values()];
  const subtotalMinor = lines.reduce(
    (sum, line) => sum + Number(line.lineTotal.amount.replace('.', '')),
    0,
  );
  return {
    mode: 'demo',
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: { amount: (subtotalMinor / 100).toFixed(2), currencyCode: 'USD' },
    recoveryLines: [],
  };
}

/** Keep invalid saved references visible so a visitor can explicitly remove them. */
export function restoreDemoCart(input: unknown): DemoCart {
  let cart = buildDemoCart([]);
  for (const line of parseCartLines(input)) {
    try {
      const next = buildDemoCart([...cartLineInputs(cart), line]);
      cart = { ...next, recoveryLines: cart.recoveryLines };
    } catch (error) {
      if (!(error instanceof CartValidationError)) throw error;
      const product = getPreviewProductDetail(line.handle);
      const variant = product?.variants.find((candidate) => candidate.id === line.variantId);
      cart.recoveryLines.push({
        ...line,
        title: product?.title ?? 'Saved piece',
        variantTitle: variant?.title ?? 'Unavailable selection',
        message:
          error.code === 'quantity_unavailable'
            ? 'Saved quantity exceeds demo availability.'
            : 'Saved demo selection is unavailable.',
      });
    }
  }
  return cart;
}

export function applyDemoCartOperation(input: unknown, value: unknown): DemoCart {
  if (typeof value !== 'object' || value === null || !('type' in value))
    throw new CartValidationError('invalid_cart');
  const operation = value as CartOperation;
  if (operation.type === 'clear') return buildDemoCart([]);
  const restored = restoreDemoCart(input);
  const lines = cartLineInputs(restored);
  if (operation.type === 'restore') return restored;
  if (operation.type === 'remove' && typeof operation.variantId === 'string') {
    return {
      ...buildDemoCart(lines.filter((line) => line.variantId !== operation.variantId)),
      recoveryLines: restored.recoveryLines.filter(
        (line) => line.variantId !== operation.variantId,
      ),
    };
  }
  let next: DemoCart;
  if (operation.type === 'add') {
    next = buildDemoCart([...lines, ...parseCartLines(operation.items)]);
  } else if (
    operation.type === 'quantity' &&
    typeof operation.variantId === 'string' &&
    lines.some((line) => line.variantId === operation.variantId)
  ) {
    next = buildDemoCart(
      lines.map((line) =>
        line.variantId === operation.variantId ? { ...line, quantity: operation.quantity } : line,
      ),
    );
  } else {
    throw new CartValidationError('invalid_cart');
  }
  parseCartLines([...cartLineInputs(next), ...restored.recoveryLines]);
  return { ...next, recoveryLines: restored.recoveryLines };
}
