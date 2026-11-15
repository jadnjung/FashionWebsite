'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatMeasurement, type SizeChart } from '@/lib/product/size-guide';

interface SizeGuidePanelProps {
  open: boolean;
  onClose: () => void;
  chart: SizeChart | null;
}

export function SizeGuidePanel({ open, onClose, chart }: SizeGuidePanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Size Guide"
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85vh] w-full max-w-full overflow-y-auto border-0 bg-esque-surface p-6 text-esque-text backdrop:bg-esque-black/70 md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-full md:w-full md:max-w-md"
    >
      <div className="flex items-center justify-between gap-4 pb-6">
        <h2 className="font-display text-heading-3 uppercase tracking-display">Size Guide</h2>
        <Button variant="secondary" onClick={onClose}>
          CLOSE
        </Button>
      </div>
      {chart ? (
        <div className="flex flex-col gap-4">
          {chart.provisional && (
            <p className="text-utility text-esque-text-secondary">
              Synthetic demo measurements. Provisional values for illustration only.
            </p>
          )}
          <p className="text-body">Garment measurements for {chart.category}.</p>
          <fieldset>
            <legend className="mb-2 text-utility">Measurement units</legend>
            <div className="flex gap-3">
              {(['in', 'cm'] as const).map((value) => (
                <label
                  key={value}
                  className="flex min-h-11 cursor-pointer items-center gap-2 border border-esque-text-secondary px-3 text-utility"
                >
                  <input
                    type="radio"
                    name="size-guide-unit"
                    value={value}
                    checked={unit === value}
                    onChange={() => setUnit(value)}
                    className="accent-esque-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
                  />
                  {value === 'in' ? 'Inches' : 'Centimeters'}
                </label>
              ))}
            </div>
          </fieldset>
          <div
            role="region"
            aria-label="Size measurements"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-esque-text"
          >
            <table className="w-full text-left text-body">
              <caption className="pb-3 text-left text-utility text-esque-text-secondary">
                {chart.provisional ? 'Synthetic ' : ''}garment measurements in{' '}
                {unit === 'in' ? 'inches' : 'centimeters'}
              </caption>
              <thead>
                <tr className="border-b border-esque-text-muted text-utility text-esque-text-secondary">
                  <th scope="col" className="py-2 pr-4">
                    Size
                  </th>
                  {chart.measurements.map((measurement) => (
                    <th key={measurement.label} scope="col" className="py-2 pr-4">
                      {measurement.label} ({unit})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row) => (
                  <tr key={row.size} className="border-b border-esque-elevated">
                    <th scope="row" className="py-2 pr-4 font-normal">
                      {row.size}
                    </th>
                    {row.values.map((value, index) => (
                      <td key={index} className="py-2 pr-4">
                        {formatMeasurement(value, unit)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="text-body">How to measure</h3>
          <ul className="list-disc space-y-3 pl-4 text-utility text-esque-text-secondary">
            {chart.measurements.map((measurement) => (
              <li key={measurement.label}>{measurement.instruction}</li>
            ))}
          </ul>
          <p className="text-utility text-esque-text-secondary">{chart.note}</p>
        </div>
      ) : (
        <div className="space-y-4 text-body text-esque-text-secondary">
          <p>Measurements for this piece are pending.</p>
          <p>
            Check the product’s fit information and compare with a garment you already wear. Contact
            us for sizing help before choosing a size.
          </p>
          <a
            href="/contact"
            className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          >
            Contact us
          </a>
        </div>
      )}
    </dialog>
  );
}
