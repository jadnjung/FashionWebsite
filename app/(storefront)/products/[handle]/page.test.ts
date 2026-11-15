import { afterEach, expect, test, vi } from 'vitest';
import { createElement, isValidElement, Suspense, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductPage from './page';
import { getProduct, getProducts } from '@/lib/shopify/products';
import { getPreviewProductDetail } from '@/lib/shopify/preview-demo-fixtures';
vi.mock('@/lib/shopify/products', async (original) => ({
  ...(await original<typeof import('@/lib/shopify/products')>()),
  getProduct: vi.fn(),
  getProducts: vi.fn(),
}));
vi.mock('@/components/product/ProductDetail', () => ({
  ProductDetail: ({ product }: { product: { title: string } }) =>
    createElement('h1', null, product.title),
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement('a', { href }, children),
}));
afterEach(() => vi.restoreAllMocks());
test('primary product construction stays independent and a recommendation failure renders local recovery', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getProduct).mockResolvedValue(
    getPreviewProductDetail('preview-featherweight-crewneck'),
  );
  let fail!: (reason: Error) => void;
  vi.mocked(getProducts).mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
  );
  const element = await ProductPage({
    params: Promise.resolve({ handle: 'preview-featherweight-crewneck' }),
    searchParams: Promise.resolve({}),
  });
  expect(getProducts).not.toHaveBeenCalled();
  const children = element.props.children as ReactElement[];
  const primary = children.find(
    (child) => isValidElement<{ product?: { title: string } }>(child) && child.props.product,
  );
  expect(renderToStaticMarkup(primary)).toContain('<h1>Featherweight Crewneck Sweater</h1>');
  type RecommendationProps = { productType: string; handle: string };
  const boundary = children.find((child) => child.type === Suspense) as ReactElement<{
    children: ReactElement<RecommendationProps>;
  }>;
  const recommendation = boundary.props.children;
  const pending = (recommendation.type as (props: RecommendationProps) => Promise<ReactNode>)(
    recommendation.props,
  );
  fail(new Error('synthetic recommendation failure'));
  const html = renderToStaticMarkup(await pending);
  expect(html).toContain('Related pieces are temporarily unavailable.');
  expect(html).toContain('Browse new arrivals');
  expect(html).not.toContain('SOMETHING WENT WRONG');
});
