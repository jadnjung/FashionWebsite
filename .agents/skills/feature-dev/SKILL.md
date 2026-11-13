---
name: "feature-dev"
description: "Develop a substantial feature through scoped discovery, architecture, implementation, and review."
---

# Feature development

Read AGENTS.md and .codex/AGENT_WORKFLOW.md. Follow their quality-first routing,
context, review, validation, and surfacebook safeguards. The coordinator owns
integration and completion. Continue authorized work autonomously and ask only
about essential missing decisions. Skill invocation supplies no external-action
or credential authorization.

## Discovery and design

1. Establish the requested outcome, acceptance criteria, affected entry points,
   constraints, and relevant current decisions. Keep a concise task plan for
   substantial work.
2. Inspect existing implementation and contracts. Delegate specific unanswered
   exploration questions when useful, with distinct scopes. Use findings and
   source references to guide further reading. Expand context until behavior,
   compatibility, and failure paths are understood.
3. Choose the smallest sound architecture consistent with the project. Compare
   alternatives when a consequential trade-off remains. Use an architecture
   specialist for genuine cross-system uncertainty. Record durable decisions
   when warranted. Pause only work dependent on essential unanswered questions.

## Implementation

Assign clear file ownership, interfaces, dependencies, acceptance criteria, and
checks. Use specialists for relevant expertise. Parallelize independent work.
Preserve others' changes and established behavior. Read applicable skills before
using them. Cover supported inputs, existing data, error recovery, concurrency,
and accessibility as relevant. Integrate the result through its normal entry points.

## Review and completion

Perform implementer self-checks, then independent quality review for substantial
changes. Cover correctness, maintainability, project conventions, and domain
risks. Add distinct specialist reviews when warranted. Reuse completed review
coverage for the same diff across command workflows. The mandatory read-only
security-engineer review still applies to supported changes.

Confirm findings against code and requirements, fix real issues, and review the
fixes. Run applicable integrated validation after integration. Rerun affected
checks after edits and broaden coverage when impact is uncertain. Report actual
results and remaining limitations. Follow AGENTS.md for commit and publication.
