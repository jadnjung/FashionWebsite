import { describe, expect, test } from 'vitest';
import { pickNextMessage, INCORRECT_CODE_MESSAGES } from './DropAccessForm';

// Asserted as literal strings (not INCORRECT_CODE_MESSAGES itself) so this
// test actually guards against copy drift from CONTENT.md §5's five
// approved lines — asserting the exported array against itself would pass
// even if every line in it silently changed. Ported from the deleted
// app/(access)/access/AccessForm.test.ts's coverage: CONTENT.md §5
// explicitly permits reusing this exact rotation for "incorrect code," not
// just "incorrect password."
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
    for (const last of INCORRECT_CODE_MESSAGES) {
      for (let i = 0; i < 20; i++) {
        expect(pickNextMessage(last)).not.toBe(last);
      }
    }
  });
});
