'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { isLowPerformanceDevice } from '@/lib/motion/media';
import type { ClosetProduct } from '@/lib/shopify/products';

// three.js + React Three Fiber live only in this chunk, fetched after
// hydration and only on devices that pass canClosetRender() — the hero's
// static poster (server-rendered, LCP-safe) is what everyone sees first,
// and what stays when the closet can't run. See DECISIONS.md D-089.
const ClosetExperience = dynamic(() => import('@/components/home/closet/ClosetExperience'), {
  ssr: false,
  loading: () => null,
});

let cachedCapability: boolean | null = null;

function canClosetRender(): boolean {
  if (cachedCapability !== null) return cachedCapability;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (isLowPerformanceDevice(nav.hardwareConcurrency, nav.deviceMemory)) {
    cachedCapability = false;
    return false;
  }
  let context: WebGL2RenderingContext | null = null;
  try {
    const canvas = document.createElement('canvas');
    context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    const info = context?.getExtension('WEBGL_debug_renderer_info');
    // Software WebGL can pass the browser's caveat hint but stall shopping
    // while shaders initialize. Inspect locally, without logging GPU details.
    const renderer = context?.getParameter(info?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER);
    cachedCapability =
      context !== null &&
      !/swiftshader|llvmpipe|softpipe|software rasterizer|basic render driver/i.test(
        String(renderer),
      );
  } catch {
    cachedCapability = false;
  } finally {
    // The real renderer creates its own context. Release this disposable probe.
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  }
  return cachedCapability;
}

// Capability never changes during a page's life — nothing to subscribe to.
const subscribe = () => () => {};

export function ClosetLoader({ products }: { products: ClosetProduct[] }) {
  // false on the server and during hydration, so the server-rendered
  // poster and the first client render always match.
  const capable = useSyncExternalStore(subscribe, canClosetRender, () => false);
  return capable ? <ClosetExperience products={products} /> : null;
}
