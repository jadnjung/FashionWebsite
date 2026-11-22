'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface QuickAddPanelProps {
  handle: string;
  title: string;
  open: boolean;
  onClose: () => void;
}

type ShoppingBody = (typeof import('./QuickAddBody'))['QuickAddBody'];
type CodeState = { status: 'idle' | 'error' } | { status: 'ready'; Body: ShoppingBody };

let bodyPromise: Promise<ShoppingBody> | undefined;
let resolvedBody: ShoppingBody | undefined;

function loadQuickAddBody(): Promise<ShoppingBody> {
  if (!bodyPromise) {
    const pending = import('./QuickAddBody').then(({ QuickAddBody }) => {
      resolvedBody = QuickAddBody;
      return QuickAddBody;
    });
    bodyPromise = pending;
    // Warmup has no accepted intent to recover. Clear a failed acquisition so
    // the next accepted opening/Retry can try transport again.
    void pending.catch(() => {
      if (bodyPromise === pending) bodyPromise = undefined;
    });
  }
  return bodyPromise;
}

export function preloadQuickAddBody(): void {
  void loadQuickAddBody();
}

// The native frame is urgent; only its shopping implementation is deferred.
export function QuickAddPanel({ handle, title, open, onClose }: QuickAddPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pendingProgrammaticCloses = useRef(0);
  const activeAttempt = useRef<AbortController | null>(null);
  const [codeState, setCodeState] = useState<CodeState>(() =>
    resolvedBody ? { status: 'ready', Body: resolvedBody } : { status: 'idle' },
  );
  const [retryToken, setRetryToken] = useState(0);

  if (!open && codeState.status === 'error') setCodeState({ status: 'idle' });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      pendingProgrammaticCloses.current += 1;
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || codeState.status !== 'idle') return;
    const controller = new AbortController();
    activeAttempt.current = controller;
    const timeout = setTimeout(() => {
      if (activeAttempt.current !== controller || controller.signal.aborted) return;
      controller.abort();
      activeAttempt.current = null;
      setCodeState({ status: 'error' });
    }, 10_000);

    loadQuickAddBody()
      .then((Body) => {
        if (controller.signal.aborted || activeAttempt.current !== controller) return;
        clearTimeout(timeout);
        activeAttempt.current = null;
        setCodeState({ status: 'ready', Body });
      })
      .catch(() => {
        if (controller.signal.aborted || activeAttempt.current !== controller) return;
        clearTimeout(timeout);
        activeAttempt.current = null;
        setCodeState({ status: 'error' });
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
      if (activeAttempt.current === controller) activeAttempt.current = null;
    };
  }, [open, retryToken, codeState.status]);

  function requestClose() {
    activeAttempt.current?.abort();
    activeAttempt.current = null;
    onClose();
  }

  const loading = open && codeState.status === 'idle';
  const Body = codeState.status === 'ready' ? codeState.Body : null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        // Own Escape before native focus restoration permits another activation.
        event.preventDefault();
        requestClose();
      }}
      onClose={(event) => {
        // Consume notifications from already-applied controlled closes, including
        // those delivered while a newer opening is pending or visible.
        if (pendingProgrammaticCloses.current > 0) {
          pendingProgrammaticCloses.current -= 1;
          return;
        }
        if (!event.currentTarget.open) requestClose();
      }}
      aria-label={`Quick Add — ${title}`}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85vh] w-full max-w-full overflow-y-auto border-0 bg-esque-surface p-6 text-esque-text backdrop:bg-esque-black/70 md:inset-0 md:m-auto md:h-fit md:max-h-[85vh] md:w-full md:max-w-sm"
    >
      <div className="flex items-center justify-between pb-6">
        <h2 className="font-display text-heading-3 uppercase tracking-display">{title}</h2>
        <Button ref={closeRef} variant="secondary" onClick={requestClose} className="shrink-0">
          CLOSE
        </Button>
      </div>
      {loading && (
        <p role="status" className="text-utility text-esque-text">
          Loading Quick Add…
        </p>
      )}
      {codeState.status === 'error' && (
        <div className="flex flex-col items-start gap-4">
          <p role="status" className="text-utility text-esque-text">
            Quick Add could not load.
          </p>
          <Button
            variant="secondary"
            onClick={(event) => {
              if (document.activeElement === event.currentTarget) closeRef.current?.focus();
              setCodeState({ status: 'idle' });
              setRetryToken((token) => token + 1);
            }}
          >
            Retry
          </Button>
          <a
            href={`/products/${handle}`}
            className="inline-flex min-h-11 items-center text-utility underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-esque-text"
          >
            VIEW PRODUCT
          </a>
        </div>
      )}
      <div aria-busy={loading}>{Body && <Body handle={handle} open={open} />}</div>
    </dialog>
  );
}
