'use client';

import Script from 'next/script';
import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { isAnalyticsConfigured } from '@/lib/analytics/config';
import {
  getAnalyticsPageContext,
  sanitizeAnalyticsUrl,
  recordAnalyticsPageContext,
} from '@/lib/analytics/page-context';
import { queueAnalyticsCommand } from '@/lib/analytics/queue';

function PageViews() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const previous = useRef<string | null>(null);
  const lastNavigation = useRef<object | null>(null);
  const navigation = useMemo(() => ({ pathname, hasQuery: query.length > 0 }), [pathname, query]);
  useEffect(() => {
    if (!isAnalyticsConfigured() || lastNavigation.current === navigation) return;
    lastNavigation.current = navigation;
    const context = getAnalyticsPageContext(
      window.location.href,
      previous.current ?? document.referrer,
    );
    recordAnalyticsPageContext(context);
    queueAnalyticsCommand('event', 'page_view', { ...context, page_title: document.title });
    previous.current = sanitizeAnalyticsUrl(window.location.href);
  }, [navigation]);
  return null;
}

export function Analytics() {
  if (!isAnalyticsConfigured()) return null;
  const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!;
  return (
    <>
      <Script
        id="esque-ga"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      />
      <PageViews />
    </>
  );
}
