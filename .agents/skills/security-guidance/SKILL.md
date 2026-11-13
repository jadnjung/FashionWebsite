---
name: "security-guidance"
description: "Review changed code for security risks before completing security-sensitive work; replaces the manual portion of the Claude security-guidance plugin."
---

# Security review

Read the changed files and applicable project instructions. Check secrets and
client/server boundaries, authorization, input validation, injection, unsafe HTML,
shell execution, redirects, dependency changes, payment and analytics privacy.
Delegate to security-engineer for substantial risks. Return concrete findings with
file/line evidence, severity, and remediation. Fix within the authorized scope and
rerun applicable checks. Never print suspected secret values.

This skill also runs when the native Stop hook requests an automatic review of
edits made during a turn. Use a read-only security-engineer subagent; the parent
handles authorized fixes and re-reviews them. The hook requests review once per
turn and records no claim that review completed. If no subagent is available,
read the role instructions and perform the review directly, stating the fallback.
The hook excludes credentials, dependencies, Claude internals, and generated
migration tooling. Pre-existing dirty changes are outside the turn baseline;
review them explicitly when requested. The replacement uses the current Codex
session, not Claude OAuth, an external reviewer account, or a nested CLI process.

