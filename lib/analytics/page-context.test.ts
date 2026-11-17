import { afterEach, expect, test, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import {
  getAnalyticsPageContext,
  sanitizeAnalyticsUrl,
  getBrowserAnalyticsContext,
  recordAnalyticsPageContext,
} from './page-context';
import { buildAnalyticsBootstrap } from './bootstrap';
import { queueAnalyticsCommand } from './queue';

afterEach(() => vi.unstubAllGlobals());

test.each(['/%73earch', '/se%61rch', '/%2fsearch', '/search%2f'])(
  'encoded Search alias %s strips query/hash in context and executable bootstrap',
  (pathname) => {
    const address = `https://esque.test${pathname}?q=synthetic%40example.test#private`;
    const expected = `https://esque.test${pathname}`;
    expect(getAnalyticsPageContext(address, address)).toEqual({
      page_location: expected,
      page_referrer: expected,
    });
    const context = {
      window: { dataLayer: [] as unknown[] },
      location: { href: address },
      document: { referrer: address },
      URL,
    };
    runInNewContext(buildAnalyticsBootstrap('G-TEST'), context);
    const config = Array.from(context.window.dataLayer[1] as ArrayLike<unknown>)[2];
    expect(config).toEqual({
      send_page_view: false,
      page_location: expected,
      page_referrer: expected,
    });
  },
);

test('malformed encoded path fails safely for location and referrer', () => {
  expect(sanitizeAnalyticsUrl('https://esque.test/%ZZ?q=private#private')).toBe('');
});

test('virtual navigation attribution is shared with child events before the page-view effect', () => {
  const browser = { location: { href: 'https://esque.test/search?q=private' } };
  vi.stubGlobal('window', browser);
  vi.stubGlobal('document', { referrer: 'https://esque.test/about' });
  expect(getBrowserAnalyticsContext()).toEqual({
    page_location: 'https://esque.test/search',
    page_referrer: 'https://esque.test/about',
  });
  browser.location.href = 'https://esque.test/products/piece';
  expect(getBrowserAnalyticsContext()).toEqual({
    page_location: 'https://esque.test/products/piece',
    page_referrer: 'https://esque.test/search',
  });
  recordAnalyticsPageContext(
    getAnalyticsPageContext(browser.location.href, 'https://esque.test/search?q=private'),
  );
  expect(getBrowserAnalyticsContext().page_referrer).toBe('https://esque.test/search');
});

test('ordinary-page fragments retain the same virtual location and prior-page attribution', () => {
  const browser = { location: { href: 'https://esque.test/products/piece' } };
  vi.stubGlobal('window', browser);
  vi.stubGlobal('document', { referrer: 'https://esque.test/search?q=private' });
  const original = getBrowserAnalyticsContext();
  browser.location.href += '#details';
  expect(getBrowserAnalyticsContext()).toEqual(original);
  expect(sanitizeAnalyticsUrl(browser.location.href)).toBe('https://esque.test/products/piece');
});

test('Search location and referrer drop every query/hash while ordinary product context remains useful', () => {
  for (const query of [
    'q=person%40example.com',
    'q=%2B1%20415%20555%201234',
    'q=https%3A%2F%2Fexample.com%2Fprivate%3Ftoken%3Dsecret',
  ]) {
    expect(
      getAnalyticsPageContext(
        `https://esque.test/search?${query}&productAfter=opaque#results`,
        `https://esque.test/search/?${query}`,
      ),
    ).toEqual({
      page_location: 'https://esque.test/search',
      page_referrer: 'https://esque.test/search/',
    });
  }
  expect(sanitizeAnalyticsUrl('https://esque.test/products/piece?variant=id')).toBe(
    'https://esque.test/products/piece?variant=id',
  );
  for (const value of [
    '',
    'invalid',
    '/search?q=private',
    'javascript:alert(1)',
    'https://user:password@esque.test/search?q=private',
  ])
    expect(sanitizeAnalyticsUrl(value)).toBe('');
});

test('the actual bootstrap JavaScript executes self-contained and configures safe context before events', () => {
  const context = {
    window: { dataLayer: [] as unknown[] },
    location: { href: 'https://esque.test/search?q=person%40example.com#private' },
    document: { referrer: 'https://esque.test/search?q=secret' },
    URL,
  };
  runInNewContext(buildAnalyticsBootstrap('G-TEST'), context);
  const commands = context.window.dataLayer.map((command) =>
    Array.from(command as ArrayLike<unknown>),
  );
  expect(commands.map((command) => command[0])).toEqual(['js', 'config']);
  expect(commands[1]).toEqual([
    'config',
    'G-TEST',
    {
      send_page_view: false,
      page_location: 'https://esque.test/search',
      page_referrer: 'https://esque.test/search',
    },
  ]);
  vi.stubGlobal('window', context.window);
  queueAnalyticsCommand('event', 'view_item', { item_id: 'piece' });
  expect(Array.from(context.window.dataLayer[2] as ArrayLike<unknown>)).toEqual([
    'event',
    'view_item',
    { item_id: 'piece' },
  ]);
  expect(buildAnalyticsBootstrap('</script><script>bad</script>')).not.toContain('</script>');
});

test('missing, blocked and frozen queues cannot interrupt the customer journey', () => {
  expect(() => queueAnalyticsCommand('event', 'page_view')).not.toThrow();
  for (const dataLayer of [
    undefined,
    Object.freeze([]),
    {
      push() {
        throw new Error('blocked');
      },
    },
  ]) {
    const window = { dataLayer };
    vi.stubGlobal('window', window);
    expect(() => queueAnalyticsCommand('event', 'page_view')).not.toThrow();
    expect(() =>
      runInNewContext(buildAnalyticsBootstrap('G-TEST'), {
        window,
        location: { href: 'https://esque.test/' },
        document: { referrer: '' },
        URL,
      }),
    ).not.toThrow();
  }
});
