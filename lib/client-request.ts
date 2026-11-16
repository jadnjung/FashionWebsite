// Search and Quick Add share the bag/wishlist's ten-second client budget.
// Race the entire operation because aborting fetch alone cannot bound a
// decoder or transport that ignores its signal.
export async function fetchJsonWithDeadline<T>(url: string, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  const controller = new AbortController();
  const onCancel = () => controller.abort(signal.reason);
  signal.addEventListener('abort', onCancel, { once: true });

  let onAbort!: () => void;
  const interrupted = new Promise<never>((_, reject) => {
    onAbort = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', onAbort, { once: true });
  });
  const timeout = setTimeout(() => {
    controller.abort(new DOMException('The request took too long.', 'TimeoutError'));
  }, 10_000);

  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { signal: controller.signal });
        controller.signal.throwIfAborted();
        if (!response.ok) throw new Error('Request failed');
        return response.json() as Promise<T>;
      })(),
      interrupted,
    ]);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', onCancel);
    controller.signal.removeEventListener('abort', onAbort);
  }
}
