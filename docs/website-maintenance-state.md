# Website maintenance checkpoint

Updated 2026-11-18 02:35 UTC. Resume AGENTS.md, .codex/WEBSITE_MAINTENANCE.md and .codex/AGENT_WORKFLOW.md.

## Active task

Item 55 selected-quantity purchase-intent analytics is implemented, reviewed and locally verified. Publication is next. Branch and published HEAD are surfacebook / c7fff198d046e0577d21258681e3302989b21e9c. Parent owns integration and publication. All specialists handed back work and all servers are stopped. Preserve unrelated untracked debug.log and Claude compatibility files.

Eight source/test paths cover event types/tests, adapter tests, the new purchase-amounts helper/tests, both purchase panels and shopping-journey browser tests. Final parent fingerprint is ad3d8499841e208381f88c38fbf50a51f6e3dbff6d673a3b00b98dcef4e20a5d, after two comment-only corrections in events.ts. The helper matches final reviewers at SHA256 11433fa19077011390dcffde6ab977493ed5fc8f9a16c7a7ee989cc98bab96d5. Parent docs include D-104, architecture, roadmap, backlog and the purchase-intent execution record.

## Verification

- Normal PDP RED proved quantity 3 cart request versus missing event quantity/value 128 instead of 384.
- Primary and security findings for negative prices and unbounded parsing were reproduced and fixed. Parent also reproduced null amount TypeError. Final guard rejects non-string values, more than 512 characters, negative amounts and non-round-tripping numbers without gating cart.
- Final reviews cleared fixes. Worker final browser run 5725 passed 65/65 across all five normal Demo profiles, including negative/oversized/null/unrepresentable Quick Add metadata with canonical cart success. Servers stopped.
- Parent integrated unit run 38389 passed 679 across 63 files. Typecheck 73762, full lint 83428 and whole-repository formatting passed. Optimized build passed. No live GA receipt is claimed.

Details are in docs/superpowers/plans/2026-11-17-purchase-intent-quantity.md. Resolve quantity once for both event and mutation, keep item price as unit price, value as decimal price times requested addition, and Retry without a second intent. Bad telemetry can omit the event while the cart continues.

## Exact next action

Review final docs/status, verify surfacebook, stage only completed item 55 source/tests and related parent docs, commit and push explicitly HEAD:refs/heads/surfacebook. Verify branch again before push, confirm remote revision and inspect matching CI. Then start item 73's confirmed per-group filter-budget mismatch, the highest remaining actionable P2 shopping-choice issue. Item 70 and other P3 proposals remain queued. No item 73 source edits exist yet.

## Hosted CI investigation

Item 57 e1e4ac8 has successful hosted CI 44123444619. Item 53 6d201c3 has failed unconfigured CI 44179007153, while frozen local CI-style reproduction 26386 passed 617 cases/15 skips, with zero unexpected and flaky results. Ignored JSON/log diagnostics live under playwright-report/diagnostics/unconfigured-6d201c3.*.

Reporter-only c7fff19 is published. It enables CI GitHub annotations alongside preserved HTML reporters. Synthetic annotation and local/CI config probes, typecheck, formatter, lint and security review passed. Hosted CI 44222096860 remains in progress at the latest snapshot, having reached Demo with no failed step. Inspect its final outcome/annotations. Item 75 remains open because older hosted failure causes are unknown.

Saved GitHub credential CI-log API reuse was rejected by automatic approval review because that specific use lacks authorization. No credential was retrieved. The explicit read-only access question remains unanswered. Do not retry, delegate or bypass it without an explicit user response. Future public annotations are repository-owned reporting and require no credential access.

## Capacity and scheduling

Actual limits interrupted earlier runs, and this continuation recovered capacity. Last check showed ordinary allowed, primary 71%, weekly 75%. Save precise checkpoints before substantial work or a limit. Maintainer remains ACTIVE every 30 minutes in chat 01a1d24c-d335-7533-83ac-b1ab13a0c637. Daily audit remains PAUSED. Root applies the website-maintainer TOML fallback. Scheduling depends on app, awake machine, permissions and actual account capacity.
