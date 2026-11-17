/** Own the queue used by our bootstrap and event adapter, independent of a third-party component's render state. */
export function queueAnalyticsCommand(...args: unknown[]): void {
  if (typeof window === 'undefined' || !args.length) return;
  try {
    const target = window as typeof window & { dataLayer?: unknown[] };
    target.dataLayer ??= [];
    // gtag's queue consumes the command's array-like arguments object.
    // eslint-disable-next-line prefer-rest-params -- Match gtag's documented queue protocol.
    target.dataLayer.push(arguments);
  } catch {
    // Analytics delivery failure must leave the customer interaction usable.
  }
}
