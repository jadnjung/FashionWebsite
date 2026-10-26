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

  test('floors non-integer input to a whole number', () => {
    expect(resolveQuantity('3.5')).toBe(3);
    expect(resolveQuantity('2.1')).toBe(2);
  });

  test('floors a sub-1 fraction to 0, then clamps it up to the minimum', () => {
    expect(resolveQuantity('0.5')).toBe(1);
  });

  test('has no upper bound when max is omitted (no regression)', () => {
    expect(resolveQuantity('999999999')).toBe(999999999);
  });

  test('clamps a quantity above max down to max', () => {
    expect(resolveQuantity('12', 1, 5)).toBe(5);
  });

  test('passes a quantity within min/max through unchanged', () => {
    expect(resolveQuantity('3', 1, 5)).toBe(3);
  });

  test('floors before applying max, so a fractional over-max value still clamps to max', () => {
    expect(resolveQuantity('5.9', 1, 5)).toBe(5);
  });

  test('never resolves below min, even when max is smaller than min', () => {
    expect(resolveQuantity('5', 1, 0)).toBe(1);
    expect(resolveQuantity('5', 2, 0)).toBe(2);
    expect(resolveQuantity('5', 2, 1)).toBe(2);
  });
});
