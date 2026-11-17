import type { FullConfig } from '@playwright/test';

export default async function verifyServerMode(config: FullConfig) {
  if (process.env.PLAYWRIGHT_EXTERNAL_SERVER !== '1') return;
  const origin = config.projects[0]?.use.baseURL;
  if (!origin) throw new Error('The external browser server requires a configured base URL.');
  const response = await fetch(origin, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok)
    throw new Error('The external browser server did not return a usable homepage.');
  const html = await response.text();
  const mode = html.match(/data-preview-mode="([^"]+)"/)?.[1];
  const profile = html.match(/data-browser-test-profile="([^"]+)"/)?.[1];
  const render = html.match(/data-render-mode="([^"]+)"/)?.[1];
  const collectionScenario = html.match(/data-preview-collection-scenario="([^"]+)"/)?.[1];
  if (
    mode !== config.metadata.previewMode ||
    profile !== (config.metadata.browserTestProfile ?? `${config.metadata.previewMode}-isolated`) ||
    collectionScenario !== config.metadata.collectionScenario ||
    (process.env.PLAYWRIGHT_PRODUCTION === '1' && render !== 'production')
  ) {
    throw new Error(
      `External browser server mode mismatch. Expected ${config.metadata.previewMode} with ${process.env.PLAYWRIGHT_PRODUCTION === '1' ? 'production' : 'development or production'} rendering, observed ${mode ?? 'unknown'}/${render ?? 'unknown'}.`,
    );
  }
}
