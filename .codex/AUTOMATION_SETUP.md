# Codex automation follow-up

Status: implemented and tested on `surfacebook`; no application or Claude source
files changed. The user authorizes commits and pushes for this migration and
future work only to `surfacebook`, never `main`. Hook execution depends on the
local Codex installation's trust state for each current hook definition.

## Automatic security review

`.codex/hooks/automatic_review.py` runs at UserPromptSubmit and Stop. It records
file hashes at prompt submission, compares them at turn end, and requests one
native Codex security-engineer review when supported source/config/lock files
changed. The security-engineer role is read-only. The parent handles authorized
fixes and re-reviews them. The current Codex session performs the model review;
there is no Claude SDK, nested CLI invocation, separate API key, or new account.

The hook covers additions, modifications, deletions, renames, staged changes and
commits made during the turn. It ignores dependency directories, original Claude
configuration, generated migration tooling, and credential-like data filenames.
Authentication/token-handling source remains covered. Initial dirty changes are
the baseline; request a whole-branch review to cover them. Diagnostics and errors
never print credential values. State is kept under the OS temporary directory,
isolated by repository, session, and turn, and stores paths/hashes rather than code.

The review continuation runs once and does not prove a reviewer completed. The
agent must report actual findings and validation, and review any remediation.
Missing baseline or detector failure produces an explicit warning and requires
the same review through the native instruction fallback.

The initial discovery snapshot recorded three enabled hook handlers awaiting
trust. Inspect `/hooks` in Codex CLI or Settings > Hooks in the desktop app for
the current local state. The snapshot in `.migration-tools/runtime-results.json`
records the installation check and does not refresh automatically. Changed hook
definitions require a new local trust decision. AGENTS.md requires automatic
review directly whenever lifecycle hooks are unavailable.

## Superpowers

Installed and enabled `superpowers@openai-curated-remote`, version **7.0.1**, through
the official Codex marketplace. A fresh Codex session confirmed all **15 skills**:
brainstorming, diagnosing-superpowers, dispatching-parallel-agents, executing-plans,
finishing-a-development-branch, receiving-code-review, requesting-code-review,
subagent-driven-development, systematic-debugging, test-driven-development,
using-git-worktrees, using-superpowers, verification-before-completion,
writing-plans, writing-skills. These are user-level plugin skills, not duplicate
project copies. Existing project/user Codex entries were preserved.

Upstream: https://github.com/obra/superpowers

## TypeScript language server

The original Anthropic typescript-lsp plugin was located and inspected. Its
`lspServers` manifest is specific to Claude Code and is not a Codex marketplace
plugin. Its upstream language server is now installed independently:

- typescript-language-server **5.3.0**
- TypeScript **5.9.3** (matching the project's TypeScript 5 requirement)

Runtime and lockfile: `.codex/tools/typescript-runtime/`.
Read-only adapter: `.codex/tools/typescript_mcp.py`.
Codex MCP server name: `typescript_lsp`.

Tools: typescript_hover, typescript_definition, typescript_references,
typescript_symbols, typescript_diagnostics. Source paths must resolve inside the
workspace; dependency, git, and original Claude internals are excluded. Line and
UTF-16 column arguments are 1-based. The adapter has no write tools or network
calls. TypeScript diagnostics are explicitly incomplete language-server snapshots;
empty results are not proof of a completed typecheck. Use the project's compiler
check for full verification. Project node_modules were absent during setup; normal
application dependency installation is needed for project-wide module resolution.

Codex successfully connected and discovered all five tools. A real temporary
TypeScript project verified hover types, definition locations, references,
document symbols, error 2322, and updates after an edit. The test also verifies
out-of-workspace and unsupported file rejection. Windows URI normalization is
handled so server-encoded drive letters match requested diagnostic URIs.

Recreate the isolated tooling installation on another machine:

```powershell
npm.cmd ci --prefix .codex/tools/typescript-runtime --ignore-scripts --no-audit --no-fund
```

Upstream: https://github.com/typescript-language-server/typescript-language-server

## Validation

All **12** follow-up tests passed, including real LSP integration, delayed semantic
diagnostic snapshot handling, post-edit updates, review baseline behavior,
add/delete/rename/commit detection, dirty baseline, credential exclusion, nested
working directory, unusual filenames, session/turn isolation, deduplication,
continuation loop prevention, and auth/token source plus dependency lock coverage.

```powershell
python -B -X utf8 .migration-tools/test_followup.py
python -B -X utf8 .migration-tools/validate_migration.py
```

The TypeScript integration test needs permission to launch Node in the local
environment; sandbox Node cannot resolve the Windows user profile directory.
No execution approval or sandbox settings were weakened. Codex strict startup,
static migration validation, and protected Claude source hashes passed. The
follow-up security review's two findings (source-name exclusions and premature
clean diagnostic semantics) were repaired and regression-tested.

This document supersedes the corresponding missing-plugin and automatic-review
limitations in the initial MIGRATION_REPORT.md; that report remains historical.
