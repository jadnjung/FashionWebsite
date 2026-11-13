# Fashion Website Development Guidelines

You are working on a production fashion website.

The objective is to produce production-quality software that is visually refined, performant, accessible, secure, maintainable, and reliable.

# Project Documentation

Before substantial work, consult the applicable project documentation:

- PROJECT.md
- DESIGN_SYSTEM.md
- INTERACTIONS.md
- CONTENT.md
- ARCHITECTURE.md
- DECISIONS.md
- ROADMAP.md

PROJECT.md defines what is being built.

DESIGN_SYSTEM.md defines the visual language: color, typography, spacing, components, and responsive rules.

INTERACTIONS.md defines animation timing, easing, cursor behavior, transitions, hover, gestures, and the interactive model. Consult it before changing any motion or animation.

CONTENT.md defines copy style, product copy, empty-state language, error language, and naming. Consult it before writing customer-facing copy.

ARCHITECTURE.md defines how the system is structured.

DECISIONS.md records important durable technical decisions.

ROADMAP.md defines current and future priorities.

# General Engineering Principles

- Think before making changes.
- Read relevant existing files before editing.
- Understand the existing architecture.
- Prefer modifying existing code over unnecessary rewrites.
- Make the smallest change that fully solves the problem.
- Favor readability and maintainability over cleverness.
- Preserve established project patterns unless there is a strong reason to change them.
- Do not introduce unnecessary dependencies.
- Do not introduce unnecessary abstractions.
- Do not silently ignore errors.
- Handle relevant edge cases.
- Fail safely.

# Repository Scope

Work only inside this repository unless explicitly instructed otherwise.

Do not intentionally access or modify unrelated files elsewhere on the computer.

# Specialized Agents

Core roles include:

- engineering-lead
- product-manager
- ui-ux-designer
- frontend-engineer
- backend-engineer
- fullstack-engineer
- qa-engineer
- devops-engineer
- data-analytics-engineer
- seo-performance-engineer
- security-engineer

Review specialists may include:

- architecture-reviewer
- test-reviewer
- ui-reviewer

## Workflow and Routing

Standard path for non-trivial work:

> You → Engineering Lead → specialist agent(s) → specialist self-check → Engineering Lead integration & review → automated validation → commit and push to `surfacebook`

Engineering Lead is a **router, architect, and reviewer** — not a mandatory extra step that duplicates work on every task. Its full routing responsibilities are defined in `.codex/agents/engineering-lead.toml`; the rules below are the policy every agent (including the top-level session) should follow.

**Route to Engineering Lead when a task:**

- spans architecture, multiple systems, or multiple disciplines
- is a roadmap milestone or a multi-file feature
- involves a decision worth recording in DECISIONS.md
- has ambiguous scope that needs to be broken down before work starts

**Handle directly, no agent dispatch, when a task is small and self-contained:**

- a typo, copy fix, or single small bug fix
- a narrow, well-specified change confined to one file or area
- a question that doesn't require writing code

When a task's size is unclear, default to handling it directly and escalate only if it turns out to touch more than expected.

**Use a specialist only when the task genuinely benefits from that discipline** — UI/UX, commerce/backend integration, animation, accessibility, testing, SEO, performance, security, or analytics are the recurring cases on this project. Do not dispatch a specialist merely because the role exists; if the work can be done competently in less time than it takes to brief a specialist, do it directly.

**Parallelism:** specialists may work at the same time only when their work is clearly separated — different files or areas, no shared state, no sequential dependency. If two specialists would touch the same files, or one's output feeds the other's input, run them sequentially instead.

**Engineering Lead always retains:**

- final say on architecture consistency
- integration of specialist output into one coherent change
- deciding when work is actually complete (see Completion below)
- running automated validation after integration — this is not satisfied by specialist self-checks alone
- the commit

Complex work should consider the perspectives of the relevant disciplines rather than relying on a single generic implementation perspective — but "considering the perspective" does not always require spawning a separate agent for it.

# Fashion Website Priorities

The website should prioritize:

1. Product discovery
2. Visual presentation
3. Usability
4. Mobile responsiveness
5. Accessibility
6. Performance
7. Reliability
8. Search visibility
9. Security
10. Maintainability

# Frontend

When working with React or Next.js:

- Prefer strong TypeScript typing.
- Follow established React patterns.
- Avoid unnecessary client-side JavaScript.
- Avoid unnecessary client components.
- Avoid unnecessary effects.
- Keep components focused.
- Prefer composition over excessive configuration flags.
- Use semantic HTML.
- Account for keyboard navigation.
- Account for screen readers.
- Support reduced-motion preferences.
- Handle loading, empty, error, and success states.

# Responsive Design

All customer-facing interfaces must be evaluated for realistic:

- mobile
- tablet
- laptop
- desktop

screen sizes.

Do not assume desktop-only interactions.

Touch targets must be usable on mobile devices.

# Accessibility

Accessibility is a product requirement, not an optional cleanup step.

Consider:

- semantic elements
- accessible names
- labels
- keyboard behavior
- focus order
- visible focus
- contrast
- alt text
- reduced motion
- form errors
- screen-reader behavior

# Images

Fashion websites are image-intensive.

Optimize product and editorial imagery appropriately.

Consider:

- intrinsic dimensions
- responsive image sizing
- loading priority
- lazy loading
- modern formats
- compression
- layout stability
- image quality

Do not unnecessarily degrade important product imagery for minor bandwidth savings.

# Performance

Actively consider:

- Core Web Vitals
- LCP
- INP
- CLS
- bundle size
- request waterfalls
- rendering strategy
- caching
- image loading
- fonts
- hydration
- third-party scripts

# SEO

Account for:

- metadata
- canonical URLs
- semantic HTML
- internal links
- sitemaps
- crawlability
- structured data
- Product schema where applicable
- Breadcrumb schema where applicable

# Backend

Server-side systems must:

- validate inputs
- enforce authorization server-side
- return intentional errors
- handle concurrency where relevant
- avoid exposing sensitive implementation information

# Security

Never trust client input.

Consider:

- authentication
- authorization
- XSS
- CSRF
- CORS
- CSP
- injection
- session security
- secrets
- environment variables
- payment security
- API security

Never expose server secrets to client bundles.

# Analytics

Analytics should use consistent documented event names and properties.

Avoid collecting unnecessary personal information.

Do not place secrets or sensitive customer information in analytics payloads.

# Testing

Use the correct level of testing:

- unit
- component
- integration
- end-to-end

Use Playwright for critical customer journeys.

Tests should verify behavior rather than implementation details.

# Validation

Before declaring work complete, run all applicable validation.

Examples:

- formatter
- lint
- typecheck
- unit tests
- component tests
- integration tests
- Playwright
- production build

Fix failures caused by the change before considering the task complete.

# Dependencies

Before adding a dependency:

1. Determine whether the capability already exists.
2. Prefer existing project dependencies.
3. Prefer platform or standard-library functionality where practical.
4. Add a dependency only when it provides meaningful value.
5. Understand its maintenance and security implications.

# Git Workflow

One logical task should normally correspond to one logical commit.

Before committing:

1. Inspect repository status.
2. Review the diff.
3. Run applicable validation.
4. Fix relevant failures.
5. Create a descriptive commit.

Do not force push.

Do not rewrite history unless explicitly instructed.

Do not create meaningless WIP commits.

# Completion

A feature is not complete simply because the code was written.

Completion means the relevant implementation has been:

- implemented
- reviewed
- tested
- validated
- documented when necessary

# Native Codex coordination

The top-level session performs engineering-lead triage and owns integration and
completion. For substantial cross-discipline work, use native subagents with the
matching role defined in `.codex/agents/`. If custom role selection is unavailable,
read the matching TOML's developer_instructions and include them in a scoped native
subagent brief; report this fallback. Never pretend a generic agent loaded a role.
Brief specialists with task, owned files, relevant docs, dependencies, and expected
validation. Parallelize only independent work; collect results, review and integrate,
then run applicable checks. Respect host concurrency and nesting limits. When an
engineering-lead subagent cannot spawn children, have it return a routing plan and
let the top-level session dispatch the specialists and return their results.

Before performing a role's task, explicitly read applicable SKILL.md files listed
in its developer_instructions from `.agents/skills/`; read referenced resources as
needed. These dependencies are explicit loading instructions, not automatic preload.
Skill guidance does not grant tools or override sandbox permissions.

Use `$feature-dev`, `$code-review`, and `$review-pr` for the migrated plugin command
workflows. Use `$security-guidance` for an explicit security review. Reviewer roles
report evidence and avoid edits unless a fixing task was explicitly assigned.

# Branch and migration safeguards

The user has authorized commits and pushes for this migration and future work,
only on branch `surfacebook`. Never commit, push, merge, or open a pull request
targeting `main`. Do not ask for routine confirmation to commit or push completed,
validated work to `surfacebook`.

Before every commit and push, verify the current branch is exactly `surfacebook`.
If another branch is checked out, stop the commit/push and preserve the work.
Push with an explicit destination: `git push origin HEAD:refs/heads/surfacebook`.
Never use a bare push, `--all`, `--mirror`, force push, or a destination other than
`refs/heads/surfacebook`. These standing instructions apply to future sessions,
agents, skills, and migration tools; they supersede historical no-push notes.

Keep `.claude/`, CLAUDE.md, and `.mcp.json` intact for Claude compatibility.
The original migration covered Codex artifacts and migration tooling. Follow the
requested scope for subsequent work. Never put credentials in configuration, logs,
or commits.
Existing host permissions remain authoritative. Claude's pnpm/git/gh allow rules
are inventoried in `.codex/migration-inventory.json`, not blanket Codex grants.
Before completing security-sensitive changes, perform the security-guidance review;
the native automatic-review hooks now detect edits made during a turn and request
a read-only security-engineer review before completion. See `.codex/AUTOMATION_SETUP.md`.
Use `typescript_lsp` MCP tools for TypeScript hover, definitions, references,
diagnostics, and symbols. The Superpowers plugin supplies planning, debugging,
TDD, and review skills; user authorization and project branch safeguards remain
authoritative, including commits and pushes only to `surfacebook`, never `main`.

Before completing any task that changes supported source, configuration, or
dependency lockfiles, automatically perform a read-only security-engineer review
of the turn's changes without asking for routine confirmation. Follow this rule
even if hook execution is unavailable or untrusted. Use native role selection;
if unavailable, read the role's TOML and perform the review directly, stating the
fallback. The parent integrates fixes and re-reviews them before completion.
Never claim a review passed merely because a hook requested one.
