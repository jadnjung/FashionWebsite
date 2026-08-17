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

> You → Engineering Lead → specialist agent(s) → specialist self-check → Engineering Lead integration & review → automated validation → commit/push

Engineering Lead is a **router, architect, and reviewer** — not a mandatory extra step that duplicates work on every task. Its full routing responsibilities are defined in `.claude/agents/engineering-lead.md`; the rules below are the policy every agent (including the top-level session) should follow.

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