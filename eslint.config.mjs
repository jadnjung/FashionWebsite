import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // ESLint's non-prefixed glob patterns anchor only to this config's base
    // directory (the repo root) and don't recursively match nested
    // directories of the same name elsewhere in the tree — so '.next/**'
    // above doesn't cover a .next build directory sitting inside another
    // project (e.g. a git worktree under .claude/worktrees/). Excluding the
    // whole .claude/ directory is correct on its own terms too: it's Claude
    // Code project tooling/config, never application source to lint.
    '.claude/**',
  ]),
]);

export default eslintConfig;
