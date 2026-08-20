import { describe, expect, test } from 'vitest';
import { NAVIGATION } from '@/lib/navigation-data';

describe('navigation-data', () => {
  test('NAVIGATION starts with the NEW category', () => {
    expect(NAVIGATION[0]).toEqual({ label: 'NEW', href: '/new' });
  });
});
