import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16's `next dev`/`next build` auto-generate an AI-agent-rules
  // block into this repo's CLAUDE.md by default. This repo's CLAUDE.md is
  // hand-maintained project documentation that must not be touched by
  // tooling — see repo root CLAUDE.md and the project owner's explicit
  // instruction not to modify it. Disabled here so every future dev/build
  // run stays a no-op against that file.
  agentRules: false,
};

export default nextConfig;
