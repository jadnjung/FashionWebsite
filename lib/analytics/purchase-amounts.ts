// Optional telemetry parsing budget; oversized source amounts never block the cart.
const MAX_AMOUNT_LENGTH = 512;

interface Decimal {
  coefficient: bigint;
  exponent: number;
}

function normalize(coefficient: bigint, exponent: number): Decimal {
  if (coefficient === BigInt(0)) return { coefficient: BigInt(0), exponent: 0 };
  while (coefficient % BigInt(10) === BigInt(0)) {
    coefficient /= BigInt(10);
    exponent += 1;
  }
  return { coefficient, exponent };
}

function parseDecimal(amount: string): Decimal | null {
  const match = /^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:[eE]([+-]?\d+))?$/.exec(amount);
  if (!match) return null;
  const digits = match[2].replace('.', '');
  // Reject overflow/underflow before constructing a potentially large coefficient.
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return null;
  if (!/[1-9]/.test(digits)) return { coefficient: BigInt(0), exponent: 0 };
  if (numeric === 0) return null;
  const fractionLength = match[2].split('.')[1]?.length ?? 0;
  const exponent = Number(match[3] ?? 0) - fractionLength;
  if (!Number.isSafeInteger(exponent)) return null;
  return normalize(BigInt(`${match[1]}${digits}`), exponent);
}

function toExactNumber(decimal: Decimal): number | null {
  const value = Number(`${decimal.coefficient}e${decimal.exponent}`);
  if (!Number.isFinite(value)) return null;
  const serialized = parseDecimal(String(value));
  return serialized?.coefficient === decimal.coefficient && serialized.exponent === decimal.exponent
    ? value
    : null;
}

/**
 * Purchase-intent unit price and line value, with decimal multiplication.
 * Only emit numbers whose serialized decimals preserve the source values.
 * This is optional telemetry, never currency rounding or cart validation.
 */
export function getPurchaseAmounts(
  amount: unknown,
  quantity: number,
): { price: number; value: number } | null {
  if (typeof amount !== 'string' || amount.length > MAX_AMOUNT_LENGTH) return null;
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  const decimal = parseDecimal(amount);
  if (!decimal || decimal.coefficient < BigInt(0)) return null;
  const price = toExactNumber(decimal);
  const value = toExactNumber(normalize(decimal.coefficient * BigInt(quantity), decimal.exponent));
  return price === null || value === null ? null : { price, value };
}
