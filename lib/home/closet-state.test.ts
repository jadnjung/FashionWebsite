import { describe, expect, test } from 'vitest';
import {
  HANGER_SPACING,
  INITIAL_CLOSET_STATE,
  clampRodPan,
  closetReducer,
  getHangerX,
} from '@/lib/home/closet-state';

describe('closetReducer', () => {
  test('hover then unhover the same garment clears the preview', () => {
    const hovered = closetReducer(INITIAL_CLOSET_STATE, { type: 'hover', handle: 'a' });
    expect(hovered.hovered).toBe('a');
    expect(closetReducer(hovered, { type: 'unhover', handle: 'a' }).hovered).toBeNull();
  });

  test('a late unhover from a previous garment does not clear the current one', () => {
    let state = closetReducer(INITIAL_CLOSET_STATE, { type: 'hover', handle: 'a' });
    state = closetReducer(state, { type: 'hover', handle: 'b' });
    state = closetReducer(state, { type: 'unhover', handle: 'a' });
    expect(state.hovered).toBe('b');
  });

  test('select pulls a garment out; dismiss returns it', () => {
    const selected = closetReducer(INITIAL_CLOSET_STATE, { type: 'select', handle: 'a' });
    expect(selected.selected).toBe('a');
    expect(closetReducer(selected, { type: 'dismiss' }).selected).toBeNull();
  });

  test('selecting another garment swaps the selection directly', () => {
    let state = closetReducer(INITIAL_CLOSET_STATE, { type: 'select', handle: 'a' });
    state = closetReducer(state, { type: 'select', handle: 'b' });
    expect(state.selected).toBe('b');
  });

  test('no-op actions return the same state object', () => {
    expect(closetReducer(INITIAL_CLOSET_STATE, { type: 'dismiss' })).toBe(INITIAL_CLOSET_STATE);
    expect(closetReducer(INITIAL_CLOSET_STATE, { type: 'unhover', handle: 'a' })).toBe(
      INITIAL_CLOSET_STATE,
    );
  });
});

describe('getHangerX', () => {
  test('centers the rod on zero', () => {
    expect(getHangerX(0, 1)).toBe(0);
    expect(getHangerX(0, 3)).toBe(-HANGER_SPACING);
    expect(getHangerX(2, 3)).toBe(HANGER_SPACING);
    expect(getHangerX(0, 2) + getHangerX(1, 2)).toBe(0);
  });
});

describe('clampRodPan', () => {
  test('locks to center when every garment fits in view', () => {
    expect(clampRodPan(5, 3, 10)).toBe(0);
  });

  test('clamps to the rod ends when the rod is wider than the view', () => {
    // 6 garments × 1.25 spacing = 7.5 wide; a 3-unit view can pan ±2.25.
    expect(clampRodPan(10, 6, 3, 1.25)).toBeCloseTo(2.25);
    expect(clampRodPan(-10, 6, 3, 1.25)).toBeCloseTo(-2.25);
    expect(clampRodPan(1, 6, 3, 1.25)).toBe(1);
  });
});
