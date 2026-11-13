---
name: "code-review"
description: "Review a pull request for actionable bugs and applicable project-instruction violations."
---

# Pull request review

Read AGENTS.md and .codex/AGENT_WORKFLOW.md. Follow their quality-first routing,
context, review reuse, and branch safeguards. Keep review read-only and local
unless posting comments was explicitly requested. Skill text grants no credential
access, publication permission, or permission to target main.

## Prepare once

Use the available GitHub API or CLI to establish PR status, title, description,
base/head revisions, changed paths, diff, and existing review comments. If remote
access is unavailable, use an available local diff and report the coverage limit.
Check applicable root and nested AGENTS.md instructions. Skip a draft unless the
user requested its review. Honor requests for a fresh review. An already reviewed
unchanged revision can reuse its coverage unless a fresh pass was requested.
Explain a closed or otherwise
inapplicable PR's status before ending the review.

## Review

Use one primary independent reviewer for a substantial PR, adding specialists
for distinct risks, uncertain contracts, or consequential changes. Small reviews
can be handled directly. Give reviewers intent, exact scope, relevant instructions,
source references, and existing evidence. Reuse coverage from other command
workflows for the same unchanged diff. The mandatory security-engineer review
applies when completing supported changes.

Trace changed behavior through relevant callers, contracts, and failure paths.
Report reproducible or well-supported defects, including input-specific bugs,
authorization failures, compatibility regressions, and clear scoped instruction
violations. Read surrounding code when needed. Filter pre-existing unrelated
issues, style nitpicks, duplicate comments, and unsupported speculation.

Validate each finding against actual code and requirements. Use targeted commands
or another specialist when needed to resolve uncertainty. A separate agent per
finding is unnecessary when existing evidence establishes the defect. Keep
uncertain concerns explicitly qualified and distinct from confirmed findings.

## Report and optional comments

Return severity, file/line evidence, trigger conditions, impact, and concrete
remediation. If no actionable findings remain, state the reviewed scope and any
coverage limitations. Never claim checks ran from static inspection alone.

Post only when explicitly authorized, including an explicit --comment request.
Use one comment per unique issue. Build source links from the actual repository,
full reviewed commit SHA, path, and line anchors. Offer a committable suggestion
only when it fully fixes the scoped issue. Check existing comments to avoid
reposting findings. Review authorization alone does not authorize application edits.
