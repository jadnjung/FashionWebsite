/**
 * A per-key cache of asset loads whose promises never reject: a failed
 * load resolves to null after `onError` is told about it. Built for the
 * homepage Collection Closet (DECISIONS.md D-089), whose garment models and
 * photos are read with React's `use()`.
 *
 * Why not throw and catch: inside a React Three Fiber canvas, any error an
 * error boundary catches is still forwarded to the browser's
 * `reportError` (Fiber's renderer wires `onCaughtError` to it), which
 * dispatches a window "error" event as if it were uncaught. An expected,
 * already-handled failure — a missing or unreachable model — would then
 * look like a crash to error monitoring. Resolving to null keeps it an
 * ordinary, logged fallback.
 *
 * Promises are cached by key so `use()` sees the same promise on every
 * render (a new promise each render would suspend forever).
 */
export function createSafeLoader<T>(
  load: (key: string) => Promise<T>,
  onError: (key: string, error: unknown) => void,
): (key: string) => Promise<T | null> {
  const cache = new Map<string, Promise<T | null>>();
  return (key) => {
    let pending = cache.get(key);
    if (!pending) {
      pending = Promise.resolve()
        .then(() => load(key))
        .catch((error: unknown) => {
          onError(key, error);
          return null;
        });
      cache.set(key, pending);
    }
    return pending;
  };
}
