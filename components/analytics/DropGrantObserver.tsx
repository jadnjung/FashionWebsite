'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { consumeDropGrantSignal } from '@/lib/access/drop-grant';

export function DropGrantObserver() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  useEffect(() => {
    consumeDropGrantSignal();
  }, [pathname, query]);
  return null;
}
