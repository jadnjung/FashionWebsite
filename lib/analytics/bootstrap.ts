import { sanitizeAnalyticsUrl } from '@/lib/analytics/page-context';

/** Configure safe context and manual page views before the remote SDK can run. */
export function buildAnalyticsBootstrap(measurementId: string): string {
  const id = JSON.stringify(measurementId).replaceAll('<', '\\u003c');
  return `try{window.dataLayer=window.dataLayer||[];window.gtag=function(){try{window.dataLayer.push(arguments);}catch{}};var safeAnalyticsUrl=${sanitizeAnalyticsUrl.toString()};window.gtag('js',new Date());window.gtag('config',${id},{send_page_view:false,page_location:safeAnalyticsUrl(location.href),page_referrer:safeAnalyticsUrl(document.referrer)});}catch{}`;
}
