/** Search input belongs in the form and URL, never in analytics location or referrer. */
export function sanitizeAnalyticsUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    const pathname = decodeURIComponent(url.pathname)
      .replace(/\/{2,}/g, '/')
      .replace(/\/$/, '')
      .toLowerCase();
    url.searchParams.delete('q');
    url.hash = '';
    if (pathname === '/search') {
      url.search = '';
    }
    return url.href;
  } catch {
    return '';
  }
}

export function getAnalyticsPageContext(location: string, referrer: string) {
  return {
    page_location: sanitizeAnalyticsUrl(location),
    page_referrer: sanitizeAnalyticsUrl(referrer),
  };
}

type PageContext = ReturnType<typeof getAnalyticsPageContext>;
const browserContexts = new WeakMap<object, PageContext>();

/** Child interaction effects can run before the route's page-view effect. */
export function getBrowserAnalyticsContext(): PageContext {
  if (typeof window === 'undefined') return getAnalyticsPageContext('', '');
  const previous = browserContexts.get(window);
  const location = sanitizeAnalyticsUrl(window.location.href);
  if (previous?.page_location === location) return previous;
  const context = getAnalyticsPageContext(
    window.location.href,
    previous?.page_location ?? document.referrer,
  );
  browserContexts.set(window, context);
  return context;
}

export function recordAnalyticsPageContext(context: PageContext): void {
  if (typeof window !== 'undefined') browserContexts.set(window, context);
}
