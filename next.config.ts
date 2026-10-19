import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next.js 16.3+ auto-generates/appends a managed "agent rules" block to
  // CLAUDE.md and AGENTS.md on every `next dev` run (including the dev
  // server Playwright's webServer boots for every E2E test run). This
  // project's CLAUDE.md is never to be modified except by explicit
  // instruction — confirmed twice this build as a live risk, since almost
  // every task boots the dev server. Opting out is the officially
  // documented mechanism, not a workaround. See DECISIONS.md D-009 and
  // https://nextjs.org/docs/app/guides/ai-agents.
  agentRules: false,
  images: {
    // Demo Mode (PREVIEW_DEMO_MODE) — opt-in, off by default everywhere;
    // see lib/shopify/preview-demo-fixtures.ts's file header and
    // DECISIONS.md D-057 for the full feature. This comment covers only
    // why `unoptimized` is set here.
    //
    // Historical root cause (verified directly at the time, not assumed):
    // the failure this worked around was NOT `sharp` being missing —
    // `sharp` was already installed as `next`'s own optionalDependency,
    // just not hoisted to the top-level node_modules (ordinary pnpm
    // behavior, confirmed via `pnpm why sharp`). The real cause: Next's
    // image optimizer fetches a *local* /public image via an internal
    // server-to-server loopback request (fetchInternalImage,
    // next/dist/server/image-optimizer.js), and that synthetic request
    // carried neither this app's access cookie nor a user-agent isbot()
    // recognized as a crawler — so the whole-site password gate's Proxy
    // (proxy.ts, since deleted — see DECISIONS.md's gate-removal entry)
    // redirected it to /access exactly as it would a cookie-less human
    // visitor, and the optimizer correctly rejected the resulting
    // redirect/HTML instead of JPEG bytes.
    //
    // Re-verified live after proxy.ts's removal (per this feature's design
    // spec's explicit instruction not to remove this flag speculatively):
    // with `unoptimized` temporarily forced to `false` under
    // PREVIEW_DEMO_MODE, `/_next/image?url=%2Fpreview-demo%2F...` now
    // returns a real, correctly-optimized JPEG — the interaction this flag
    // worked around no longer reproduces, since nothing intercepts the
    // loopback request anymore. The flag is deliberately kept anyway (not
    // removed on this finding alone): it costs nothing to leave — Demo
    // Mode is an explicitly low-fidelity preview convenience (D-057) — and
    // removing a working-as-shipped flag belongs with a reviewed decision,
    // not a speculative edit made while verifying something else. See
    // DECISIONS.md for this finding's recorded disposition.
    unoptimized: process.env.PREVIEW_DEMO_MODE === '1' ? true : undefined,
    // ProductCard (ROADMAP.md Phase 4) is the first real next/image
    // consumer of Shopify product photography. next/image refuses to
    // optimize a remote src whose hostname isn't allow-listed here
    // (400 Bad Request) — without this, every product image would break
    // the moment a real store exists, even though nothing in this
    // Shopify-unconfigured environment currently exercises it. Verified
    // against Next.js's current remotePatterns docs before adding.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
