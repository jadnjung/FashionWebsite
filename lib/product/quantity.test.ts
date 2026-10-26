import { describe, expect, test } from 'vitest';
import { resolveQuantity } from '@/lib/product/quantity';

// This covers resolveQuantity's own pure clamping behavior. It does NOT by
// itself prove the clear-then-retype sequence bug stays fixed — that bug was
// about *when* clamping ran (synchronously inside onChange) relative to
// React's controlled-input re-render, not about the clamping math itself.
// This repo has no jsdom/React Testing Library (vitest.config.ts's
// environment is 'node'), so a real keystroke-by-keystroke DOM simulation
// isn't possible here — see ProductPurchasePanel.tsx's onChange/onBlur
// split, which is what actually fixes the sequence (onChange is now a plain
// passthrough with nothing left to eagerly clamp; this function only runs
// on blur). The exact reported sequence was verified live instead, the same
// way the original bug was found.
describe('resolveQuantity', () => {
  test('passes a valid quantity through unchanged', () => {
    expect(resolveQuantity('12')).toBe(12);
    expect(resolveQuantity('1')).toBe(1);
  });

  test('clamps an empty string to the minimum', () => {
    // The specific input value that caused the reported bug when clamped
    // eagerly inside onChange instead of here, on blur.
    expect(resolveQuantity('')).toBe(1);
  });

  test('clamps zero and negative values to the minimum', () => {
    expect(resolveQuantity('0')).toBe(1);
    expect(resolveQuantity('-5')).toBe(1);
  });

  test('clamps non-numeric input to the minimum', () => {
    expect(resolveQuantity('abc')).toBe(1);
  });

  test('respects a custom minimum', () => {
    expect(resolveQuantity('1', 2)).toBe(2);
    expect(resolveQuantity('5', 2)).toBe(5);
  });

  test('does not floor non-integer values (preserves prior behavior)', () => {
    expect(resolveQuantity('3.5')).toBe(3.5);
  });
});
