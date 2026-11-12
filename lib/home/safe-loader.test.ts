import { describe, expect, test, vi } from 'vitest';
import { createSafeLoader } from '@/lib/home/safe-loader';

describe('createSafeLoader', () => {
  test('resolves to the loaded value', async () => {
    const get = createSafeLoader(async (key) => `asset:${key}`, vi.fn());
    await expect(get('a.glb')).resolves.toBe('asset:a.glb');
  });

  test('a failed load resolves to null (never rejects) and reports the error once', async () => {
    const error = new Error('404');
    const onError = vi.fn();
    const get = createSafeLoader(() => Promise.reject(error), onError);

    await expect(get('missing.glb')).resolves.toBeNull();
    await expect(get('missing.glb')).resolves.toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('missing.glb', error);
  });

  test('a loader that throws synchronously is handled the same way', async () => {
    const onError = vi.fn();
    const get = createSafeLoader(() => {
      throw new Error('bad url');
    }, onError);
    await expect(get('x')).resolves.toBeNull();
    expect(onError).toHaveBeenCalledOnce();
  });

  test('returns the same promise for the same key (required by React use())', () => {
    const load = vi.fn(async (key: string) => key);
    const get = createSafeLoader(load, vi.fn());
    expect(get('a')).toBe(get('a'));
    expect(get('a')).not.toBe(get('b'));
  });

  test('loads each key only once', async () => {
    const load = vi.fn(async (key: string) => key);
    const get = createSafeLoader(load, vi.fn());
    await Promise.all([get('a'), get('a'), get('a')]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
