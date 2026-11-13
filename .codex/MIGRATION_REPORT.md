# Claude Code to Codex migration

**Current publication policy:** The user authorizes commits and pushes for this
migration and future work only on `surfacebook`, never `main`. Verify the branch
before every commit/push and use `git push origin HEAD:refs/heads/surfacebook`.
Earlier no-push statements describe the initial migration and are superseded.

**Follow-up:** Superpowers is now installed and enabled, a TypeScript LSP MCP
adapter is installed and tested, and native automatic-review hooks are implemented.
See [AUTOMATION_SETUP.md](AUTOMATION_SETUP.md) for current status and the remaining
Codex hook trust activation requirement. The original findings below are historical.

Completed local migration on `surfacebook`, 2026-11-12. No push, merge, commit,
or application source changes were made. Claude compatibility is preserved.

## Method and provenance

Used OpenAI's official `migrate-to-codex` skill downloaded by Skill Installer from
https://github.com/openai/skills/tree/main/skills/.curated/migrate-to-codex .
The installed skill and official migrator are retained under `.migration-tools/`.
Ran scan, plan, doctor, dry-run, migration, generated-artifact repairs, validation,
and a final dry-run. Python requires `-X utf8` on this Windows installation.
The session did not expose the skill's requested native TODO tool; progress was
tracked in conversation without creating a TODO file.

Current official documentation was checked for custom agents, skills, MCP,
configuration, and hooks. The skill's April 2026 differences table is older than
the current docs: current Codex supports more lifecycle hooks and async behavior.
The security plugin limitation here is its Claude SDK/OAuth/backend dependence,
not a claim that Codex lacks all those lifecycle events.

- https://learn.chatgpt.com/docs/agent-configuration/subagents
- https://learn.chatgpt.com/docs/build-skills
- https://learn.chatgpt.com/docs/config-file/config-reference
- https://learn.chatgpt.com/docs/extend/mcp?surface=cli
- https://learn.chatgpt.com/docs/hooks

## Discovery and inventory

Inspected project `.claude/`, root CLAUDE.md, `.mcp.json`, relevant user
`.claude/settings.json`, marketplace metadata, enabled plugin sources, synced
skills, and configuration structure/MCP keys in user `.claude.json`. No matching
repository entry was present in that user file; no global MCP servers were found.
Credential files, OAuth account values, session history, and other projects were
excluded. User Codex configuration was not edited; existing integrations remain.

The full sanitized inventory is `migration-inventory.json`. It includes all 14
project agent→skill dependencies, enabled plugin file inventories, 13 user synced
skills, Claude allow rules, and worktree settings. The official scan misses synced
desktop skills and plugin-bundled commands; both were inspected separately.

## Generated artifacts

- Root AGENTS.md retains project engineering, design, security, testing, and git
  guidance, with native orchestration, explicit skill loading, branch safeguards,
  and nested-delegation fallback.
- `.codex/agents/`: 14 project roles plus 10 namespaced plugin roles = 24 agents.
  Role responsibilities and reasoning intent retained; `max` maps to `xhigh`.
  Plugin model family names are replaced by inherited Codex session models.
  Read-only reviewers use the read-only sandbox. Host policy remains authoritative.
- `.agents/skills/`: six project skills, frontend-design, three command workflows
  (feature-dev, code-review, review-pr), and security-guidance = 11 skills.
- All project skill resources copied, including rules, metadata, compiled guides,
  and references omitted by the official converter. Original frontmatter metadata
  is retained in source-metadata.json. Oversized compiled AGENTS.md manuals were
  moved to references/compiled-guide.md and skill pointers updated. Three broken
  inherited local links were repaired only in generated copies.
- `.codex/config.toml`: Context7 stdio MCP, native multi-agent enabled, four-thread
  per-session cap, friendly personality, hooks feature enabled. No credentials.
- `.codex/hooks.json`: compatible local SessionStart security context reminder.
  No network, credential reads, SDK installs, or automatic account connection.
- Plugin licenses retained under migration-licenses/ and skill-local license files.

## Project agent dependencies

| Agent | Explicit skill dependencies |
| --- | --- |
| architecture-reviewer | vercel-react-best-practices, vercel-composition-patterns |
| backend-engineer | gen-test |
| data-analytics-engineer | gen-test |
| devops-engineer | gen-test |
| engineering-lead | vercel-react-best-practices, vercel-composition-patterns, web-design-guidelines, gen-test |
| frontend-engineer | vercel-react-best-practices, vercel-composition-patterns, web-design-guidelines, vercel-react-view-transitions, gen-test |
| fullstack-engineer | vercel-react-best-practices, vercel-composition-patterns, web-design-guidelines, gen-test |
| product-manager | writing-guidelines |
| qa-engineer | gen-test, web-design-guidelines |
| security-engineer | gen-test |
| seo-performance-engineer | vercel-react-best-practices, web-design-guidelines, writing-guidelines |
| test-reviewer | gen-test |
| ui-reviewer | web-design-guidelines |
| ui-ux-designer | web-design-guidelines, vercel-composition-patterns, vercel-react-view-transitions, writing-guidelines |

Codex does not reproduce Claude's skill preload metadata. Each migrated project
agent instead instructs itself to open the relevant project SKILL.md explicitly.
Native discovery and actual specialist skill-file loading were tested separately.

## Enabled plugins

| Plugin | Disposition |
| --- | --- |
| superpowers | Source unavailable; manual installation required |
| feature-dev | Command skill and 3 namespaced subagents |
| code-review | Command skill; posting requires explicit user request |
| pr-review-toolkit | Command skill and 6 namespaced subagents |
| code-simplifier | 1 namespaced subagent |
| security-guidance | Startup reminder hook and explicit review skill; Claude SDK LLM review not ported |
| frontend-design | Skill and license copied |
| typescript-lsp | Claude LSP registration unsupported; use existing TypeScript compiler and editor language service |

Namespacing preserves both feature-dev and review-toolkit code-reviewer roles and
both code-simplifier roles without collisions. Claude plugin registry entries and
marketplace registrations were not copied into Codex as if they were compatible.
superpowers is enabled in project settings but missing from the available source
tree; its unspecified workflows cannot be reconstructed faithfully.

## User-level setup

No direct custom user instructions, agents, commands, or skills were found by the
official scan. User settings only specify update channel, theme, and TUI mode;
they were inventoried, not imposed over existing Codex preferences.

Thirteen synced desktop skills were detected. These are provider-managed skills,
not this repository's custom implementation. Their dispositions are explicit:

| User synced skill | Codex disposition |
| --- | --- |
| built-in-browser, chrome-browser, computer-use | Existing Codex computer-use skill and native CUA tools; Claude tool APIs are not copied |
| docx, docs | Existing documents skill; Claude editable-doc connector UI is not ported |
| pdf | Existing PDF skill |
| pptx | Existing presentations skill |
| xlsx | Existing spreadsheets skill |
| skill-creator | Existing native skill-creator |
| google-workspace | Use connected document tools/appropriate native skills; Google account connection required when needed |
| deep-research | Native web/research tools and subagents; desktop-specific report workflow not imported globally |
| import-memory | Claude memory write API has no migrated endpoint; manual review required |
| morning | Account/calendar/recurring-task workflow requires separate setup; not activated |

No unrelated global Codex configuration or existing skills were overwritten.

## Hooks, permissions, and behavior differences

There are no direct project or user settings hooks. The enabled security-guidance
plugin supplies SessionStart SDK bootstrap, UserPromptSubmit baseline tracking,
PostToolUse pattern and commit/push review, and Stop async LLM review hooks.
Only the compatible local startup context/reminder intent was adapted. It does
not recreate pattern scanning, baseline state, async wakeups, or Claude-backed LLM
reviews. The explicit security-guidance skill and engineering-lead completion
instructions retain the security-review responsibility. Full automatic parity
would require a separately designed Codex-backed reviewer; it is not silently
represented as working. New hook sources may require Codex's normal trust review;
trust was not bypassed. Hook payload execution was tested directly, not a trusted
lifecycle dispatch in the user's interactive session.

Claude Bash allow rules were retained verbatim in the sanitized inventory. They
are not automatically broad Codex command permissions. Existing sandbox/approval
policy is inherited. No bypass, network grant, or danger-full-access mode was
introduced. Worktree baseRef=head becomes explicit guidance to retain the current
branch/ref if a worktree is needed; no worktree was created.

Command arguments become user task details, tool-specific names become native
tools, model families inherit the session model, and agent references are namespaced.
Review comments remain local unless the user explicitly asks to post them.
User-authorized autonomy takes precedence over legacy redundant confirmation steps.

## Validation and tests

| Check | Result |
| --- | --- |
| Official target validator | Passed generated artifacts; only two warnings remain in untouched original Claude compiled guides |
| Codex 0.167.2 strict startup | Passed |
| Agent TOML validation | All 24 parsed with required fields and allowed generated keys |
| Skill validation/dependencies | All 11 valid; every project role dependency resolves |
| Live skills/list | All 11 enabled; no skill discovery errors |
| Native custom-role discovery | All 24 roles exposed in a fresh Codex session |
| Live individual role selection | engineering-lead, frontend-engineer, security-engineer, backend-engineer, qa-engineer passed |
| Native nested delegation | engineering-lead coordinated frontend/security; one capacity rejection resolved by waiting and retrying |
| Explicit role-loading fallback | Lead→frontend/security passed; frontend loaded its five skills and inspected 100 support files |
| Context7 MCP | Connected; resolve-library-id and query-docs tools discovered |
| Hook | JSON parsed; local handler ran and returned valid SessionStart context |
| Credential scan | No common credential patterns found; no credential files copied |
| Source integrity | Every protected project Claude source hash matches; git tracked diff remains empty |

The first native spawn test used an ephemeral CLI session and hit a missing-rollout
runtime error. A normal persisted read-only Codex session resolved it and passed
native role selection/nesting. This is recorded as a runtime caveat, not hidden.
The remaining 19 roles were structurally validated and discovered, not individually
task-executed. Probes did not run application test suites or builds because no
application source was changed. MCP testing verified handshake/tool discovery,
not external documentation retrieval or every pre-existing unrelated integration.

## Remaining manual attention

1. Restore/install the missing superpowers source if those workflows are required.
2. Review/trust the new local reminder hook in Codex when prompted. Full automatic
   security-guidance LLM/pattern parity is not implemented.
3. Claude's TypeScript LSP plugin registration has no equivalent migrated manifest;
   use the editor TypeScript service and existing pnpm typecheck workflow.
4. Connect Google/calendar services only if the corresponding desktop workflows
   are needed. Claude memory and morning automation were not activated in Codex.
5. Start a fresh Codex session to consume the complete updated project catalog.
   Session nesting/concurrency limits still apply; AGENTS.md documents fallback.

## Evidence and repeatability

- migration-inventory.json: complete sanitized source inventory and dependency map.
- migration-source-hashes.json: protected source integrity baseline.
- migration-validation.txt and migration-validation-results.json: final checks.
- migration-runtime-results.json: sanitized live skill and MCP discovery results.
- migrate-to-codex-report.txt: original automatic conversion findings, before repairs.
- migration-final-dry-run.txt: source-based proposed conversion after repairs.

The official converter continues to propose manual-review rows from unchanged
Claude metadata on a new dry-run. Those are source-conversion advisories, not
unresolved markers in the repaired Codex artifacts. Do not rerun its write mode
over the reviewed target without repeating the repair pass. For validation:

```powershell
python -X utf8 .migration-tools/validate_migration.py
python -X utf8 .migration-tools/migrate-to-codex/scripts/migrate-to-codex.py --validate-target .codex
```

Publication is authorized only on surfacebook. Consult Git history and remote
status for the current publication state; never publish to main.
