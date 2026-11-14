export interface CartLineInput {
  handle: string;
  variantId: string;
  quantity: number;
}

export interface CartLine extends CartLineInput {
  title: string;
  image: { url: string; altText: string | null } | null;
  selectedOptions: { name: string; value: string }[];
  unitPrice: { amount: string; currencyCode: string };
  productMinPrice: { amount: string; currencyCode: string };
  lineTotal: { amount: string; currencyCode: string };
  quantityMax: number;
}

export interface DemoCart {
  mode: 'demo';
  lines: CartLine[];
  totalQuantity: number;
  subtotal: { amount: string; currencyCode: string };
  recoveryLines: (CartLineInput & { title: string; variantTitle: string; message: string })[];
}

export type CartOperation =
  | { type: 'restore' }
  | { type: 'add'; items: CartLineInput[] }
  | { type: 'quantity'; variantId: string; quantity: number }
  | { type: 'remove'; variantId: string }
  | { type: 'clear' };

export const DEMO_QUANTITY_LIMIT = 99;

export type CartErrorCode =
  | 'invalid_cart'
  | 'variant_unavailable'
  | 'quantity_unavailable'
  | 'cart_unconfigured'
  | 'cart_failed';

export class CartValidationError extends Error {
  constructor(public readonly code: CartErrorCode) {
    super(code);
  }
}

export const EMPTY_DEMO_CART: DemoCart = {
  mode: 'demo',
  lines: [],
  totalQuantity: 0,
  subtotal: { amount: '0.00', currencyCode: 'USD' },
  recoveryLines: [],
};

export const DEMO_CART_STORAGE_KEY = 'esque:demo-cart';

/** Only variant references and quantities cross the mutation and persistence boundary. */
export function parseCartLines(value: unknown): CartLineInput[] {
  if (!Array.isArray(value) || value.length > 50) throw new CartValidationError('invalid_cart');
  return value.map((item: unknown) => {
    if (typeof item !== 'object' || item === null) throw new CartValidationError('invalid_cart');
    const { handle, variantId, quantity } = item as Record<string, unknown>;
    if (
      typeof handle !== 'string' ||
      !/^[a-z0-9-]{1,100}$/.test(handle) ||
      typeof variantId !== 'string' ||
      variantId.length < 1 ||
      variantId.length > 150 ||
      typeof quantity !== 'number' ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > DEMO_QUANTITY_LIMIT
    ) {
      throw new CartValidationError('invalid_cart');
    }
    return { handle, variantId, quantity };
  });
}

export function cartLineInputs(cart: DemoCart): CartLineInput[] {
  return cart.lines.map(({ handle, variantId, quantity }) => ({ handle, variantId, quantity }));
}

export function storedCartLines(cart: DemoCart): CartLineInput[] {
  return [
    ...cartLineInputs(cart),
    ...cart.recoveryLines.map(({ handle, variantId, quantity }) => ({
      handle,
      variantId,
      quantity,
    })),
  ];
}

export function readStoredCart(raw: string | null): CartLineInput[] {
  if (!raw) return [];
  const stored: unknown = JSON.parse(raw);
  if (
    typeof stored !== 'object' ||
    stored === null ||
    !('v' in stored) ||
    stored.v !== 1 ||
    !('lines' in stored)
  ) {
    throw new CartValidationError('invalid_cart');
  }
  return parseCartLines(stored.lines);
}
