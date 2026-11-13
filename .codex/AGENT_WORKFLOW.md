# Esque agent workflow

Use this workflow with the assigned role and the current AGENTS.md instructions. The role catalog and its document, skill, tool, and handoff dependencies are recorded in [agent-capabilities.json](agent-capabilities.json).

## Project context

Shopify owns products, variants, prices, inventory, carts, orders, payments, checkout, and fulfillment. The Next.js storefront owns the customer experience and thin integrations. Establish the existing integration boundary before adding server logic.

Read the relevant current project documents and latest applicable DECISIONS.md entries. The current roadmap takes precedence over historical implementation plans when they describe retired work. D-063 removed the whole-site entrance gate. Upcoming collection access remains separately scoped. D-089 introduced the Collection Closet and D-091 replaced the single-model hotspots with a curated looks ring. The current analytics event is look_select. Verify these facts in the implementation before changing an affected feature.

## Assignment and handoff

### Quality-first execution

Choose effort from the change's scope, uncertainty, and consequences. Keep
security, accessibility, commerce correctness, regression coverage, and integrated
validation as acceptance criteria wherever applicable. Escalate investigation,
independent review, or test coverage when evidence is incomplete or risk grows.
Token savings come from eliminating repeated work. Keep model and reasoning
quality appropriate to the task and respect the active role configuration.

- The top-level session performs engineering-lead triage and integration. Add a
  lead subagent only for a distinct architectural decision or decomposition task.
- Handle small self-contained tasks directly. For substantial work, dispatch the
  smallest set of specialists with distinct responsibilities. A fullstack agent
  may own a tightly coupled UI/server feature. Split independent disciplines when
  that improves expertise or coverage.
- Explore each question once. Reuse an explorer's findings, then read the code
  needed to implement, verify contracts, or resolve uncertainty. Read additional
  context whenever the evidence is insufficient.
- Default to isolated briefs with `fork_turns="none"` when supported. Include the
  objective, acceptance criteria, owned paths, relevant docs/skills, interfaces,
  dependencies, and required checks. Use full history when essential context
  cannot be conveyed reliably in the brief. Tell implementers about other workers
  and preserve their edits.
- Follow up with the same implementer or reviewer for fixes. Independent fresh
  review is valuable when the change's risk warrants another perspective.
- Read the assigned role's registry entry and applicable document sections.
  Treat listed skills as task-dependent candidates. Open applicable SKILL.md
  files before use, then only relevant supporting references. Reuse instructions
  already loaded in the current context. Search large docs for affected features
  and current decisions, expanding to surrounding sections when needed.
- Keep handoffs focused on changed contracts, findings, evidence, and unresolved
  issues. Link source locations. Summarize long command output with the command,
  exit status, counts, and relevant failures. Preserve full logs when diagnosis
  requires them and suppress secret values.
- Batch independent searches and checks where safe. Continue local work while
  specialists run. Use event-driven bounded waits within host limits when idle.

### Review and validation reuse

The coordinator tracks the reviewed diff or revision, covered risks, findings,
fixes, and validation results in the task context. A new artifact is needed only
when durable project documentation adds value.

Use one primary quality review for substantial changes, adding specialists for
distinct risks or requested review aspects. Cover correctness, maintainability,
project rules, and applicable domain concerns. Run the required read-only
security-engineer review for supported changes. An already completed security
review can satisfy a later hook request if it covers the complete current diff.
Check for intervening edits before reusing it. Review fixes and newly affected
contracts before completion. A hook request alone supplies no review evidence.

Use focused checks during iteration and the applicable integrated checks before
completion. Reuse successful results only when their inputs, dependencies,
configuration, and relevant environment remain unchanged. The coordinator verifies
specialist evidence and runs the required integrated checks after integration.
Rerun affected checks after fixes, broadening coverage for shared infrastructure,
cross-cutting contracts, uncertain impact, or unexpected failures. A documentation
or agent-instruction change needs structural validation and behavioral scenarios
as applicable. Application changes need the relevant compiler, test, build, and
browser evidence. Full CI keeps its configured checks.

| Work | Primary owner | Typical collaborators |
| --- | --- | --- |
| Scope, priorities, acceptance criteria | product-manager | engineering-lead, ecommerce-merchandiser |
| Architecture and integrated delivery | engineering-lead | affected engineering and review roles |
| Visual direction and interaction specification | ui-ux-designer | brand-content-editor, frontend-engineer |
| Responsive UI and customer interactions | frontend-engineer | backend-engineer, ui-reviewer |
| Shopify/server integration and commerce contracts | backend-engineer | security-engineer, frontend-engineer |
| A scoped feature spanning UI and server | fullstack-engineer | relevant design, QA, and security roles |
| Product facts, sizing, media, collections, and look curation | ecommerce-merchandiser | backend-engineer, brand-content-editor |
| Brand, product, collection, and interface language | brand-content-editor | merchandising, design, and SEO roles |
| Behavioral and browser testing | qa-engineer | implementing engineers, test-reviewer |
| CI, build tooling, environments, and release readiness | devops-engineer | engineering-lead, security-engineer |
| Events, consent, funnels, and attribution | data-analytics-engineer | product-manager, implementing engineers |
| Crawlability, metadata, structured data, and performance | seo-performance-engineer | content, merchandising, and frontend roles |
| Security findings and remediation verification | security-engineer | backend-engineer, devops-engineer |
| Independent architecture, tests, or UI review | architecture-reviewer, test-reviewer, ui-reviewer | engineering-lead |

The ten plugin-derived roles remain available for focused exploration, architecture proposals, code/comment/type/error/test review, and simplification. Their names are preserved for existing feature-dev and review-pr workflows.

The coordinating session owns scope, integration, validation, and publication. Assign specialists only when their discipline helps the task. Supply the outcome, acceptance criteria, owned files, relevant decisions, upstream dependencies, and expected validation. Allocate overlapping files sequentially. Respect the host's current concurrency limit and batch independent reviews when necessary.

Specialists implement and self-check their assigned scope. Review assignments produce evidence and remediation proposals. Return the following information when applicable.

- What changed or what was reviewed, with file and line references
- Decisions and assumptions that affect behavior
- Contract changes and the downstream roles that need them
- Commands actually run, their results, and any missing prerequisites
- Remaining findings, external dependencies, or unverified behavior

The coordinator resolves conflicting findings, checks the integrated result, and reviews fixes. Keep routine authorized edits and checks moving. Ask only about essential decisions or external access that the existing request does not supply. Follow the surfacebook publication policy in AGENTS.md.

## Tools and access

Custom agents inherit tools, MCP connections, and permissions from the parent session. A role description or a sandbox_mode field in a custom-agent file does not establish an independent permission boundary. Treat review-only instructions as an assignment constraint. If hard isolation is required, the parent must supply an appropriate runtime sandbox. [Codex custom-agent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents)

| Tool group | Use | Availability check |
| --- | --- | --- |
| Repository | rg, file reads, targeted edits, diffs, and package scripts | Inspect the active session tools and package.json |
| Context7 | Current version-matched React, Next.js, Shopify, and other API documentation | Resolve the library ID, then query the relevant API. Use official web documentation if the server is unavailable |
| TypeScript LSP | Definitions, references, hover, symbols, and diagnostic snapshots | Use the five typescript_lsp tools when connected. Diagnostics are incomplete snapshots and require compiler validation for completion |
| Browser | Inspect the running storefront, responsive layout, keyboard flow, console, and network | Use the session's supported browser capability and its skill. If unavailable, run Playwright after checking dependencies |
| Playwright | Repeatable customer journeys and browser regression checks | Check project dependencies and installed Chromium/WebKit. Use the configured tests and environment settings |
| Git and CI | Review changes, publish to surfacebook, inspect actual check results | Verify the current branch. Check gh availability and connection before using GitHub-specific commands |
| Creative assets | Generate or review brand imagery and mockups when requested | Use an available image tool and its skill. Keep product accuracy, source attribution, and brand requirements explicit |
| External commerce services | Store-specific data, preview deployments, email flows, and production operations | Verify the actual connected account, scope, environment, and task authorization before using Shopify, Klaviyo, or Vercel tools |

The configured project MCP servers are Context7 and TypeScript LSP. Their presence in config is checked separately from a successful connection. Store-specific services require their own connection or server environment. Read sample environment-variable names from .env.local.example and avoid printing actual secret values.

The registry lists useful tool groups for routing. It grants no additional permissions and does not guarantee that a host exposes every listed tool. Report an unavailable capability and use a supported fallback for the same task.

## Skills

Open the relevant SKILL.md before applying a role's skill dependency. Follow its supporting resources as needed. The fashion-commerce skill supplies commerce-specific acceptance criteria. React and design skills support implementation, and gen-test supports behavior-focused validation. Superpowers supplies planning, debugging, implementation, and review workflows when installed. Select the relevant workflow within the requested scope.

## Validation

Choose checks that verify the change through its real entry point. Determine which prerequisites and external accounts they need before running them.

| Change | Evidence to collect |
| --- | --- |
| UI or interaction | Relevant unit/component tests, keyboard and focus behavior, mobile/tablet/desktop layouts, reduced motion, and targeted browser checks |
| Product, variant, cart, or integration | Contract/error tests, unavailable and sold-out states, currency/quantity correctness, and the applicable customer journey |
| Content or merchandising | Verified source facts, actual destinations, variant consistency, imagery and size information, accessible labels, and relevant metadata |
| SEO or performance | Server-rendered metadata and status codes, canonical/structured data consistency, bundle or browser measurements, and supported fallbacks |
| Release or configuration | Configuration parsing, environment separation, build/test results, CI behavior, and rollback implications |

Available project scripts include pnpm format:check, pnpm lint, pnpm typecheck, pnpm test:unit, pnpm build, pnpm test:e2e, and pnpm test:e2e:demo. The latter runs populated fixture journeys. Read the Playwright configuration before starting a server because local suites may reuse one. Application dependencies and browser binaries must be installed before these checks can run.

When the shell uses a different Node or pnpm version, use the isolated project runtime. Run `python .codex/tools/run_project.py --check` to verify it, then pass the normal pnpm arguments, such as `python .codex/tools/run_project.py typecheck` or `python .codex/tools/run_project.py install --frozen-lockfile`. Recreate it with `npm ci --prefix .codex/tools/development-runtime --no-audit --no-fund`. This tooling package uses the versions recorded in its own lockfile.

For agent setup changes, run python -B -X utf8 .migration-tools/validate_migration.py, Codex strict configuration startup, and focused discovery or role probes when the runtime is available. A structural check proves configuration validity. Report live execution separately.

The CI workflow runs on surfacebook pushes and pull requests. Its agent-setup job validates role/skill/document/handoff contracts and source preservation. The application job runs formatting, lint, typecheck, unit tests, build, and both browser suites. Read the actual job results before describing CI as passed.
