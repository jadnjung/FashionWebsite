import { describe, expect, it, vi } from 'vitest';
import { hasFinePointerAndHover, isLowPerformanceDevice, prefersReducedMotion } from './media';

describe('prefersReducedMotion', () => {
  it('queries the exact reduced-motion media feature', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    prefersReducedMotion(matchMedia);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('returns true when the query matches', () => {
    expect(prefersReducedMotion(() => ({ matches: true }))).toBe(true);
  });

  it('returns false when the query does not match', () => {
    expect(prefersReducedMotion(() => ({ matches: false }))).toBe(false);
  });
});

describe('hasFinePointerAndHover', () => {
  it('queries the exact fine-pointer-and-hover media feature', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    hasFinePointerAndHover(matchMedia);
    expect(matchMedia).toHaveBeenCalledWith('(hover: hover) and (pointer: fine)');
  });

  it('returns true when the query matches (desktop mouse/trackpad)', () => {
    expect(hasFinePointerAndHover(() => ({ matches: true }))).toBe(true);
  });

  it('returns false when the query does not match (touch/coarse pointer)', () => {
    expect(hasFinePointerAndHover(() => ({ matches: false }))).toBe(false);
  });
});

describe('isLowPerformanceDevice', () => {
  it('flags a device with 2 or fewer logical cores', () => {
    expect(isLowPerformanceDevice(2, undefined)).toBe(true);
    expect(isLowPerformanceDevice(1, undefined)).toBe(true);
  });

  it('does not flag a device with more than 2 logical cores', () => {
    expect(isLowPerformanceDevice(3, undefined)).toBe(false);
    expect(isLowPerformanceDevice(8, undefined)).toBe(false);
  });

  it('flags a device reporting 2GB or less of memory, independent of core count', () => {
    expect(isLowPerformanceDevice(8, 2)).toBe(true);
    expect(isLowPerformanceDevice(8, 1)).toBe(true);
  });

  it('does not flag a device reporting more than 2GB of memory', () => {
    expect(isLowPerformanceDevice(8, 3)).toBe(false);
  });

  it('returns false when neither signal is available (never guesses low-performance from absence of data)', () => {
    expect(isLowPerformanceDevice(undefined, undefined)).toBe(false);
  });

  it('treats an ordinary mid-range device (4 cores, no memory signal) as not low-performance', () => {
    expect(isLowPerformanceDevice(4, undefined)).toBe(false);
  });
});
