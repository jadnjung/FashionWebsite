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
