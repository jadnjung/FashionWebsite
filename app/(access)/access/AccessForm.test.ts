import { describe, expect, test } from 'vitest';
import { pickNextMessage, INCORRECT_PASSWORD_MESSAGES } from './AccessForm';

describe('pickNextMessage', () => {
  test('returns one of the five approved CONTENT.md §5 lines', () => {
    const message = pickNextMessage(null);
    expect(INCORRECT_PASSWORD_MESSAGES).toContain(message);
  });

  test('never immediately repeats the last message shown', () => {
    for (const last of INCORRECT_PASSWORD_MESSAGES) {
      for (let i = 0; i < 20; i++) {
        expect(pickNextMessage(last)).not.toBe(last);
      }
    }
  });
});
