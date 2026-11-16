import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchJsonWithDeadline } from './client-request';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('client JSON request deadline', () => {
  test('bounds headers even when the transport ignores cancellation', async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      requestSignal = init.signal as AbortSignal;
      return new Promise(() => {});
    });
    const request = fetchJsonWithDeadline('/api/search?q=coat', new AbortController().signal);
    const outcome = expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(10_000);
    await outcome;
    expect(requestSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  test('the same budget covers decoding and rejects a late body', async () => {
    vi.useFakeTimers();
    let receiveHeaders!: (response: { ok: boolean; json: () => Promise<unknown> }) => void;
    const headers = new Promise((resolve) => {
      receiveHeaders = resolve;
    });
    let release!: (value: unknown) => void;
    const body = new Promise((resolve) => {
      release = resolve;
    });
    vi.stubGlobal('fetch', () => headers);
    const request = fetchJsonWithDeadline('/api/products/coat', new AbortController().signal);
    const outcome = expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(6_000);
    receiveHeaders({ ok: true, json: () => body });
    await vi.advanceTimersByTimeAsync(4_000);
    await outcome;
    release({ product: 'late' });
    await expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(vi.getTimerCount()).toBe(0);
  });

  test('closing cancels pending decoding immediately and clears its timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', async () => ({ ok: true, json: () => new Promise(() => {}) }));
    const controller = new AbortController();
    const request = fetchJsonWithDeadline('/api/search?q=coat', controller.signal);
    const outcome = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(1);
    controller.abort();
    await outcome;
    expect(vi.getTimerCount()).toBe(0);
  });

  test('an already-closed session never starts I/O', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    controller.abort();
    await expect(
      fetchJsonWithDeadline('/api/search?q=coat', controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
  });

  test('successful decoding releases the timer and returns the typed data', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ products: ['coat'] })));
    await expect(
      fetchJsonWithDeadline<{ products: string[] }>(
        '/api/search?q=coat',
        new AbortController().signal,
      ),
    ).resolves.toEqual({ products: ['coat'] });
    expect(vi.getTimerCount()).toBe(0);
  });

  test('HTTP failures and malformed JSON reject and release their timers', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 503 }));
    await expect(
      fetchJsonWithDeadline('/api/search?q=coat', new AbortController().signal),
    ).rejects.toThrow();
    expect(vi.getTimerCount()).toBe(0);
    vi.stubGlobal('fetch', async () => new Response('{broken'));
    await expect(
      fetchJsonWithDeadline('/api/search?q=coat', new AbortController().signal),
    ).rejects.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});
