import { expect, test } from '@playwright/test';

function canonical(html: string) {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
}

test('server HTML gives distinct inventory continuations their normalized canonical', async ({
  request,
}) => {
  for (const path of ['/new', '/collections/collection-001']) {
    const first = await request.get(path);
    expect(first.status()).toBe(200);
    const html = await first.text();
    expect(canonical(html)).toBe(`http://localhost:3000${path}`);
    const next = html
      .match(/href="([^"]+)"[^>]*>Next products<\/a>/)?.[1]
      ?.replaceAll('&amp;', '&');
    expect(next).toBeTruthy();
    const destination = new URL(next!, 'http://localhost:3000');
    destination.hash = '';
    const continuation = await request.get(
      `${destination.pathname}${destination.search}&utm_source=test`,
    );
    expect(continuation.status()).toBe(200);
    const continuedHtml = await continuation.text();
    expect(canonical(continuedHtml)).toBe(destination.href);
    expect(continuedHtml).toContain('First page');
    expect(continuedHtml).toContain('End of results.');
    expect(continuedHtml).not.toContain('name="robots" content="noindex');
  }
  const archive = await request.get('/archive/collection-000?after=preview%3A2&utm_source=test');
  expect(archive.status()).toBe(200);
  expect(canonical(await archive.text())).toBe(
    'http://localhost:3000/archive/collection-000?after=preview%3A2',
  );
});

test('malformed continuation and filter variations use their intentional first-page canonical', async ({
  request,
}) => {
  for (const path of [
    '/new?after=invalid',
    '/collections/collection-001?after=invalid',
    '/archive/collection-000?after=invalid',
    '/new?available=1&utm_source=test',
    '/new?sort=price-asc',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(canonical(html)).toBe(`http://localhost:3000${path.split('?')[0]}`);
    if (path.includes('after=invalid')) expect(html).not.toContain('>First page</a>');
  }
});

test('server-rendered offer resolves to the variant supplying all advertised facts', async ({
  request,
}) => {
  const handle = 'preview-featherweight-crewneck';
  const response = await request.get(`/products/${handle}`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const product = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
    .find((data) => data['@type'] === 'Product');
  expect(product?.offers).toBeTruthy();
  const detail = await request.get(`/api/products/${handle}`);
  expect(detail.status()).toBe(200);
  const { product: facts } = await detail.json();
  const offerUrl = new URL(product.offers.url);
  const variant = facts.variants.find(
    (item: { id: string }) => item.id === offerUrl.searchParams.get('variant'),
  );
  expect(variant).toBeTruthy();
  expect(product.offers.price).toBe(variant.price.amount);
  expect(product.offers.priceCurrency).toBe(variant.price.currencyCode);
  expect(product.offers.availability).toBe(
    variant.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
  );
  expect((await request.get(offerUrl.href)).status()).toBe(200);
});
