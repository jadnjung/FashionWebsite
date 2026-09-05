'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface SizeGuidePanelProps {
  open: boolean;
  onClose: () => void;
}

const PLACEHOLDER_MEASUREMENTS: [string, string, string][] = [
  ['S', '38', '27'],
  ['M', '40', '28'],
  ['L', '42', '29'],
  ['XL', '44', '30'],
];

// DESIGN_SYSTEM.md §46 — side panel (desktop) / bottom sheet (mobile),
// implemented as ONE native <dialog> whose position switches responsively
// via CSS rather than two separate components. See DECISIONS.md D-027 for
// why this uses the native element instead of FullScreenMenu's hand-rolled
// role="dialog" pattern: showModal() gives focus-trapping, Escape-to-close,
// and a backdrop natively — FullScreenMenu's WebKit-specific workarounds
// (explicit tabIndex, manual focus restore, Strict-Mode-safe open-tracking)
// exist because it hand-builds a *different*, bespoke full-screen
// transition; a plain utility panel doesn't need that bespoke mechanism.
//
// Measurements below are placeholder content, clearly labeled as such —
// PROJECT.md §101 lists final sizes/measurements as still-open product
// decisions. The panel mechanism is real; the numbers are illustrative.
export function SizeGuidePanel({ open, onClose }: SizeGuidePanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Size Guide"
      className="fixed inset-x-0 bottom-0 m-0 max-h-[85vh] w-full max-w-full overflow-y-auto border-0 bg-esque-surface p-6 text-esque-text backdrop:bg-esque-black/70 md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-full md:w-full md:max-w-md"
    >
      <div className="flex items-center justify-between pb-6">
        <h2 className="font-display text-heading-3 uppercase tracking-display">Size Guide</h2>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="pb-4 text-utility uppercase tracking-metadata text-esque-text-muted">
        ESQUE PLACEHOLDER — MEASUREMENTS
      </p>
      <table className="w-full text-left text-body">
        <thead>
          <tr className="border-b border-esque-text-muted text-utility uppercase tracking-metadata text-esque-text-secondary">
            <th scope="col" className="py-2">
              Size
            </th>
            <th scope="col" className="py-2">
              Chest (in)
            </th>
            <th scope="col" className="py-2">
              Length (in)
            </th>
          </tr>
        </thead>
        <tbody>
          {PLACEHOLDER_MEASUREMENTS.map(([size, chest, length]) => (
            <tr key={size} className="border-b border-esque-elevated">
              <td className="py-2">{size}</td>
              <td className="py-2">{chest}</td>
              <td className="py-2">{length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </dialog>
  );
}
