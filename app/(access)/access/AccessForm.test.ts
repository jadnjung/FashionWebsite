import { describe, expect, test } from 'vitest';
import { pickNextMessage, INCORRECT_PASSWORD_MESSAGES } from './AccessForm';

// Asserted as literal strings (not `INCORRECT_PASSWORD_MESSAGES` itself) so
// this test actually guards against copy drift from CONTENT.md §5's five
// approved lines — asserting the exported array against itself would pass
// even if every line in it silently changed.
const APPROVED_CONTENT_MD_MESSAGES = [
  'NOT THIS ONE.',
  'ACCESS NOT RECOGNIZED.',
  'TRY ANOTHER.',
  'ACCESS DENIED.',
  'TRY AGAIN.',
];

describe('pickNextMessage', () => {
  test('returns one of the five approved CONTENT.md §5 lines', () => {
    const message = pickNextMessage(null);
    expect(APPROVED_CONTENT_MD_MESSAGES).toContain(message);
  });

  test('never immediately repeats the last message shown', () => {
    for (const last of INCORRECT_PASSWORD_MESSAGES) {
      for (let i = 0; i < 20; i++) {
        expect(pickNextMessage(last)).not.toBe(last);
      }
    }
  });
});
