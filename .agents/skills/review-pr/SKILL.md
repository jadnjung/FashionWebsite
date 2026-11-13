---
name: "review-pr"
description: "Review a pull request or local diff using relevant specialized review perspectives."
---

# Specialized review

Read AGENTS.md and .codex/AGENT_WORKFLOW.md. Apply their context, review reuse,
validation, and branch safeguards. Establish the requested review aspects and
exact diff or revision. Include staged, unstaged, and new files for a local review,
or the correct base/head for a pull request. Check GitHub tool availability only
when remote PR information is needed. Review findings stay local unless posting
was explicitly authorized. Review assignments are read-only.

## Select coverage

For the default comprehensive review, cover general correctness, project rules,
and each applicable risk below. Explicit aspect requests scope the review to those
aspects. Use the smallest team with distinct expertise and reuse current evidence
from prior reviews of the same unchanged scope. Add independent specialists when
complexity, uncertainty, or consequences warrant them.

| Aspect | Role | Applies when |
| --- | --- | --- |
| code | pr-review-toolkit-code-reviewer | General review, including relevant contracts and callers |
| tests | pr-review-toolkit-pr-test-analyzer | Behavior changes or coverage may be affected, even without test edits |
| comments | pr-review-toolkit-comment-analyzer | Substantial comments or documentation contracts change |
| errors | pr-review-toolkit-silent-failure-hunter | Failure paths, catches, retries, or fallbacks change |
| types | pr-review-toolkit-type-design-analyzer | New or changed type invariants affect correctness |
| security | security-engineer | Mandatory supported-change review and relevant security risks |
| simplify | pr-review-toolkit-code-simplifier | Explicitly requested simplification or assigned remediation of confirmed complexity |

An explicit simplify request authorizes scoped edits. Otherwise return a
remediation proposal for the implementing parent. Any resulting edits require
applicable validation and fix review. Preserve the mandatory security review
when this workflow is part of completing supported changes.

## Execute and report

Brief reviewers with intent, exact diff, applicable instructions, relevant context,
known evidence, and coverage gaps. Parallelize independent review scopes. Inspect
context and callers needed to validate reachable failures. Consolidate duplicate
findings and verify them against requirements. Report severity, file/line evidence,
trigger conditions, impact, and remediation. Separate confirmed defects from
optional suggestions and avoid filler or repeated positive observations.

The parent integrates authorized fixes, requests focused re-review, and runs
applicable integrated checks. Preserve existing passing evidence only while its
inputs and environment remain valid. Summarize actual coverage, findings,
validation, and unverified behavior. An all-aspects request receives every
applicable perspective, with team size chosen from the work's risk and scope.
