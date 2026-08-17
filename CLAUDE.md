# Fashion Website Development Guidelines

You are working on a production fashion website.

The objective is to produce production-quality software that is visually refined, performant, accessible, secure, maintainable, and reliable.

# Project Documentation

Before substantial work, consult the applicable project documentation:

- PROJECT.md
- DESIGN_SYSTEM.md
- ARCHITECTURE.md
- DECISIONS.md
- ROADMAP.md

PROJECT.md defines what is being built.

DESIGN_SYSTEM.md defines the visual language and interaction system: color, typography, spacing, components, motion, and responsive rules.

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

Use specialized project agents when their expertise materially applies.

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

Complex work should consider the perspectives of the relevant disciplines rather than relying on a single generic implementation perspective.

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