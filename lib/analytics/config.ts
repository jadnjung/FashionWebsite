/** The public assertion is tied to the stream whose automatic URL collection was reviewed. */
export function isAnalyticsConfigured(): boolean {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  return Boolean(
    measurementId && process.env.NEXT_PUBLIC_GA4_STREAM_PRIVACY_VERIFIED_FOR === measurementId,
  );
}
