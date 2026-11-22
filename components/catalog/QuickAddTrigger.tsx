'use client';

import { useId, useRef, useState, useSyncExternalStore } from 'react';
import { QuickAddPanel, preloadQuickAddBody } from '@/components/product/QuickAddPanel';
import { trackEvent } from '@/lib/analytics/gtag';

interface QuickAddTriggerProps {
  handle: string;
  title: string;
}

const subscribeReadiness = () => () => {};
const getClientReady = () => true;
const getServerReady = () => false;

export function QuickAddTrigger({ handle, title }: QuickAddTriggerProps) {
  const ready = useSyncExternalStore(subscribeReadiness, getClientReady, getServerReady);
  const readinessId = useId();
  const [open, setOpen] = useState(false);
  // Retain the native frame after first use so controlled close runs close()
  // and restores focus rather than removing an open dialog from the DOM.
  const [hasEverOpened, setHasEverOpened] = useState(false);
  const opening = useRef(false);

  function handleClose() {
    opening.current = false;
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        disabled={!ready}
        aria-describedby={!ready ? readinessId : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => {
          if (!ready || opening.current) return;
          opening.current = true;
          // Native modal return focus needs an explicit target on Safari.
          event.currentTarget.focus();
          trackEvent('quick_add_open', { item_id: handle, item_name: title });
          setHasEverOpened(true);
          // Native modality must become available before body code resolves.
          setOpen(true);
        }}
        onMouseEnter={preloadQuickAddBody}
        onFocus={preloadQuickAddBody}
        className="w-fit py-1 text-left text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 transition-opacity duration-200 ease-esque hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text disabled:cursor-wait disabled:opacity-40 [@media(hover:hover)_and_(pointer:fine)]:pointer-events-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:pointer-events-auto [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:pointer-events-auto [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
      >
        QUICK ADD
      </button>
      {!ready && (
        <span id={readinessId} className="sr-only">
          Quick Add is loading. View this piece to choose options.
        </span>
      )}
      {hasEverOpened && (
        <QuickAddPanel handle={handle} title={title} open={open} onClose={handleClose} />
      )}
    </>
  );
}
