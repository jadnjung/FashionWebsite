'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DEMO_CART_STORAGE_KEY,
  EMPTY_DEMO_CART,
  readStoredCart,
  storedCartLines,
  type CartErrorCode,
  type CartLineInput,
  type CartOperation,
  type DemoCart,
} from '@/lib/cart/model';

const ERROR_MESSAGES: Record<CartErrorCode, string> = {
  invalid_cart: 'The demo bag could not be read. Clear the bag to start again.',
  cart_full: 'The demo bag is full. Remove a piece before adding another.',
  variant_unavailable:
    'A selected demo variant is unavailable. Update your selection or remove the piece.',
  quantity_unavailable:
    'The selected quantity exceeds demo availability. Review your bag or change your selection.',
  cart_unconfigured: 'Purchasing is not available yet.',
  cart_failed: 'The demo bag could not be updated. Please try again.',
};

interface CartContextValue {
  demo: boolean;
  cart: DemoCart;
  pending: boolean;
  error: string | null;
  notice: string;
  storageWarning: boolean;
  crossTabWarning: boolean;
  addItems: (items: CartLineInput[]) => Promise<boolean>;
  setQuantity: (variantId: string, quantity: number) => Promise<boolean>;
  remove: (variantId: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
  retry: () => Promise<boolean>;
}

const CartContext = createContext<CartContextValue | null>(null);
const OPERATION_TIMEOUT_MS = 10_000;

export function CartProvider({ demo, children }: { demo: boolean; children: ReactNode }) {
  const [cart, setCart] = useState(EMPTY_DEMO_CART);
  const [pending, setPending] = useState(demo);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);
  const [crossTabWarning, setCrossTabWarning] = useState(false);
  const cartRef = useRef(EMPTY_DEMO_CART);
  const busyRef = useRef(false);
  const storageFailedRef = useRef(false);
  const retryOperationRef = useRef<CartOperation | null>(null);
  const queuedRefreshRef = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async function mutateCart(operation: CartOperation, background = false) {
      if (!demo) {
        setError(ERROR_MESSAGES.cart_unconfigured);
        return false;
      }
      // The local lock also covers rapid activations before React renders pending.
      if (busyRef.current) return false;
      busyRef.current = true;
      const controller = new AbortController();
      activeRequestRef.current = controller;
      const timeout = window.setTimeout(() => {
        controller.abort(new DOMException('Bag update timed out', 'TimeoutError'));
      }, OPERATION_TIMEOUT_MS);
      let onAbort: () => void;
      const cancelled = new Promise<never>((_, reject) => {
        onAbort = () => reject(controller.signal.reason);
        controller.signal.addEventListener('abort', onAbort, { once: true });
      });
      setPending(true);
      if (!background) {
        retryOperationRef.current = null;
        setError(null);
        setNotice('');
      }

      function fail(message: string) {
        // A storage refresh must preserve an unresolved shopper action and its feedback.
        if (background && retryOperationRef.current && retryOperationRef.current.type !== 'restore')
          return false;
        retryOperationRef.current = operation;
        setError(message);
        setNotice('');
        return false;
      }

      async function execute() {
        controller.signal.throwIfAborted();
        let raw: string | null = null;
        let lines = storedCartLines(cartRef.current);
        if (!storageFailedRef.current) {
          try {
            raw = window.localStorage.getItem(DEMO_CART_STORAGE_KEY);
          } catch {
            storageFailedRef.current = true;
            setStorageWarning(true);
          }
          // Clear remains available when an old storage schema or corrupt value is present.
          if (!storageFailedRef.current && operation.type !== 'clear') {
            try {
              lines = readStoredCart(raw);
            } catch {
              throw new Error('invalid_cart');
            }
          }
        }
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines, operation }),
          cache: 'no-store',
          signal: controller.signal,
        });
        const result = (await response.json()) as { cart?: DemoCart; error?: CartErrorCode };
        // Some transports may complete after cancellation. They never commit stale state.
        controller.signal.throwIfAborted();
        if (!response.ok || !result.cart || result.cart.mode !== 'demo') {
          return fail(ERROR_MESSAGES[result.error ?? 'cart_failed'] ?? ERROR_MESSAGES.cart_failed);
        }

        // Browsers without Web Locks detect a concurrent write before persisting.
        if (!navigator.locks && !storageFailedRef.current && operation.type !== 'restore') {
          let currentRaw: string | null;
          try {
            currentRaw = window.localStorage.getItem(DEMO_CART_STORAGE_KEY);
          } catch {
            storageFailedRef.current = true;
            setStorageWarning(true);
            currentRaw = raw;
          }
          if (currentRaw !== raw) {
            return fail('The demo bag changed in another tab. Please try again.');
          }
        }
        cartRef.current = result.cart;
        setCart(result.cart);
        if (operation.type !== 'restore') {
          setNotice(operation.type === 'add' ? 'Added to demo bag.' : 'Demo bag updated.');
          try {
            window.localStorage.setItem(
              DEMO_CART_STORAGE_KEY,
              JSON.stringify({ v: 1, lines: storedCartLines(result.cart) }),
            );
            storageFailedRef.current = false;
            setStorageWarning(false);
          } catch {
            storageFailedRef.current = true;
            setStorageWarning(true);
          }
        }
        if (!background || retryOperationRef.current?.type === 'restore') {
          retryOperationRef.current = null;
          setError(null);
        }
        return true;
      }

      try {
        // Read, simulate, and persist under the same origin-wide lock to preserve multi-tab adds.
        if (navigator.locks) {
          return await Promise.race([
            navigator.locks.request(DEMO_CART_STORAGE_KEY, { signal: controller.signal }, () =>
              // Ending this callback releases the lock even if a transport ignores abort.
              Promise.race([execute(), cancelled]),
            ),
            cancelled,
          ]);
        }
        setCrossTabWarning(true);
        return await Promise.race([execute(), cancelled]);
      } catch (failure) {
        if (controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError')
          return false;
        return fail(
          controller.signal.reason?.name === 'TimeoutError'
            ? 'The demo bag took too long to update. Please try again.'
            : failure instanceof Error && failure.message === 'invalid_cart'
              ? ERROR_MESSAGES.invalid_cart
              : ERROR_MESSAGES.cart_failed,
        );
      } finally {
        window.clearTimeout(timeout);
        controller.signal.removeEventListener('abort', onAbort!);
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
          busyRef.current = false;
          setPending(false);
          if (queuedRefreshRef.current && !storageFailedRef.current) {
            queuedRefreshRef.current = false;
            queueMicrotask(() => void mutateCart({ type: 'restore' }, true));
          }
        }
      }
    },
    [demo],
  );

  useEffect(() => {
    if (!demo) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void mutate({ type: 'restore' });
    });
    function syncStorage(event: StorageEvent) {
      if ((event.key !== null && event.key !== DEMO_CART_STORAGE_KEY) || storageFailedRef.current)
        return;
      if (busyRef.current) {
        queuedRefreshRef.current = true;
        return;
      }
      void mutate({ type: 'restore' }, true);
    }
    window.addEventListener('storage', syncStorage);
    return () => {
      active = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      busyRef.current = false;
      queuedRefreshRef.current = false;
      window.removeEventListener('storage', syncStorage);
    };
  }, [demo, mutate]);

  const addItems = useCallback(
    (items: CartLineInput[]) => mutate({ type: 'add', items }),
    [mutate],
  );
  const setQuantity = useCallback(
    (variantId: string, quantity: number) => mutate({ type: 'quantity', variantId, quantity }),
    [mutate],
  );
  const remove = useCallback(
    (variantId: string) => mutate({ type: 'remove', variantId }),
    [mutate],
  );
  const clear = useCallback(() => mutate({ type: 'clear' }), [mutate]);
  const retry = useCallback(() => {
    const operation = retryOperationRef.current;
    return operation ? mutate(operation) : Promise.resolve(false);
  }, [mutate]);

  return (
    <CartContext
      value={{
        demo,
        cart,
        pending,
        error,
        notice,
        storageWarning,
        crossTabWarning,
        addItems,
        setQuantity,
        remove,
        clear,
        retry,
      }}
    >
      {children}
    </CartContext>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('CartProvider is required.');
  return context;
}
