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
    // Root cause (verified directly, not assumed): the failure this works
    // around is NOT `sharp` being missing. `sharp` is already installed —
    // as `next`'s own optionalDependency, resolved by pnpm into next's
    // private dependency tree (node_modules/.pnpm/next@.../node_modules/
    // sharp), just not hoisted to the top-level node_modules/sharp, which
    // is ordinary pnpm behavior, not a broken install (confirmed via
    // `pnpm why sharp`). The real cause: Next's image optimizer fetches a
    // *local* /public image via an internal server-to-server loopback
    // request (fetchInternalImage, next/dist/server/image-optimizer.js),
    // and that synthetic request carries neither this app's access cookie
    // nor a user-agent isbot() recognizes as a crawler — so proxy.ts's
    // access gate (ARCHITECTURE.md §6, DECISIONS.md D-005/D-018/D-019)
    // redirects it to /access exactly as it would a cookie-less human
    // visitor. The optimizer receives that redirect/HTML instead of JPEG
    // bytes and correctly rejects it — "isn't a valid image... received
    // null" is detectContentType's magic-byte sniff failing, which runs
    // before sharp (or any decoder) is ever invoked. Reproduced directly:
    // curl'ing a demo image path with a real-browser user-agent and no
    // cookie 307-redirects to /access; the same request with the access
    // cookie, or with curl's own default (isbot-classified) user-agent,
    // returns the real image. This codebase's only next/image consumer
    // before Demo Mode (ProductCard, real Shopify photography) always used
    // a remote cdn.shopify.com URL, which never exercises the local-
    // loopback path — so this interaction had never been triggered before
    // Demo Mode's local preview-demo/*.jpg images.
    //
    // Fix chosen: bypass the optimizer entirely for Demo Mode's local
    // images (this flag) rather than change proxy.ts's matcher to exempt
    // local static paths. The latter would be the structurally "complete"
    // fix — real local-path next/image usage would work everywhere, not
    // just here — but it means changing a security-relevant access-control
    // boundary to benefit a narrow, off-by-default preview convenience
    // with no other current consumer. `undefined`, not `false`, when the
    // flag is unset, so Next's own default optimizer behavior (and real
    // Shopify photography via remotePatterns below) is untouched at every
    // other time. If this codebase ever adds a real (non-Demo-Mode)
    // local-path next/image consumer, revisit proxy.ts's matcher — the
    // interaction above will reproduce for that usage too.
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
