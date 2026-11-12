'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ClosetInfoPanel } from '@/components/home/closet/ClosetInfoPanel';
import { CAMERA_FOV, ClosetScene } from '@/components/home/closet/ClosetScene';
import { ClosetGesture } from '@/components/home/closet/closet-gesture';
import { trackEvent } from '@/lib/analytics/gtag';
import { INITIAL_CLOSET_STATE, closetReducer } from '@/lib/home/closet-state';
import { prefersReducedMotion } from '@/lib/motion/media';
import { formatPrice } from '@/lib/product/price';
import type { ClosetProduct } from '@/lib/shopify/products';

interface ClosetExperienceProps {
  products: ClosetProduct[];
}

/**
 * The homepage's 3D Collection Closet (DECISIONS.md D-089). Loaded only on
 * the client, only once ClosetLoader has confirmed WebGL is available, and
 * layered over the hero's static poster, which stays visible until the
 * first frame with every garment has rendered.
 *
 * The canvas itself is aria-hidden; the same interactions are exposed to
 * keyboard and screen-reader users through a row of real buttons (one per
 * garment) that appears when focused.
 */
export default function ClosetExperience({ products }: ClosetExperienceProps) {
  const [state, dispatch] = useReducer(closetReducer, INITIAL_CLOSET_STATE);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion] = useState(() => prefersReducedMotion(window.matchMedia));
  const hostRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [gesture] = useState(() => new ClosetGesture());

  const selectedProduct = products.find((p) => p.handle === state.selected) ?? null;

  const onHover = useCallback((handle: string) => dispatch({ type: 'hover', handle }), []);
  const onUnhover = useCallback((handle: string) => dispatch({ type: 'unhover', handle }), []);
  const onDismiss = useCallback(() => dispatch({ type: 'dismiss' }), []);
  const onSelect = useCallback(
    (handle: string) => {
      const product = products.find((p) => p.handle === handle);
      if (!product) return;
      trackEvent('closet_item_select', { item_id: product.handle, item_name: product.title });
      dispatch({ type: 'select', handle });
    },
    [products],
  );

  // Escape returns the focused garment and hands focus back to its button.
  // Clicking anywhere outside the closet (header, page below) does too —
  // clicks on the canvas itself are resolved by the scene.
  useEffect(() => {
    if (!state.selected) return;
    const selected = state.selected;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      dispatch({ type: 'dismiss' });
      const button = buttonRefs.current.get(selected);
      if (button && hostRef.current?.contains(document.activeElement)) button.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || hostRef.current?.contains(event.target)) return;
      dispatch({ type: 'dismiss' });
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [state.selected]);

  // Stop rendering entirely while the hero is scrolled out of view.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? true),
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const cursorLabel = state.selected ? 'DRAG' : state.hovered ? 'VIEW' : undefined;

  return (
    <div
      ref={hostRef}
      data-closet
      data-closet-selected={state.selected ? 'true' : 'false'}
      className="absolute inset-0"
    >
      <div
        aria-hidden="true"
        data-cursor={cursorLabel}
        className={`absolute inset-0 transition-opacity duration-700 ease-esque ${ready ? 'opacity-100' : 'opacity-0'} ${
          state.hovered || state.selected ? 'cursor-pointer' : ''
        }`}
      >
        <Canvas
          frameloop={visible ? 'always' : 'never'}
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.2, 8], fov: CAMERA_FOV }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ touchAction: 'pan-y' }}
          onPointerMissed={() => {
            if (!gesture.dragged) dispatch({ type: 'dismiss' });
          }}
        >
          <Suspense fallback={null}>
            <ClosetScene
              products={products}
              state={state}
              reducedMotion={reducedMotion}
              gesture={gesture}
              onHover={onHover}
              onUnhover={onUnhover}
              onSelect={onSelect}
              onDismiss={onDismiss}
            />
            <ReadySignal onReady={() => setReady(true)} />
          </Suspense>
        </Canvas>
      </div>

      {/* Keyboard and screen-reader access to the same closet: visually
          hidden until a button inside receives focus. */}
      <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-4 focus-within:right-4 focus-within:top-4 focus-within:z-30 md:focus-within:left-8 md:focus-within:right-8">
        <h2 className="sr-only">Collection pieces</h2>
        <ul className="flex flex-wrap gap-2">
          {products.map((product) => (
            <li key={product.handle}>
              <button
                ref={(node) => {
                  if (node) buttonRefs.current.set(product.handle, node);
                  else buttonRefs.current.delete(product.handle);
                }}
                type="button"
                aria-pressed={state.selected === product.handle}
                onFocus={() => onHover(product.handle)}
                onBlur={() => onUnhover(product.handle)}
                onClick={() =>
                  state.selected === product.handle ? onDismiss() : onSelect(product.handle)
                }
                className="min-h-6 border border-esque-text/30 bg-esque-black/80 px-3 py-1.5 text-utility uppercase tracking-nav text-esque-text aria-pressed:border-esque-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
              >
                {product.title}, {formatPrice(product.minPrice)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ClosetInfoPanel product={selectedProduct} onClose={onDismiss} />
    </div>
  );
}

/** Mounts only after every garment inside the same Suspense boundary has loaded. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}
