# Website maintenance checkpoint

This file is the current handoff for the website-maintainer agent. The shared backlog remains docs/website-improvement-backlog.md. Follow .codex/WEBSITE_MAINTENANCE.md and AGENTS.md.

## Current task

- Status is queued.
- Active item is 72, preserving unapplied choices across filter-option pages.
- Base revision is 798445460b6e72a605d52361c8192e43d942aadd on surfacebook.
- Initial setup owner is maintenance-setup-2026-11-16 in chat 01a1d24c-d335-7533-83ac-b1ab13a0c637. Its owned paths are AGENTS.md, the new maintainer role/workflow/registry, automation setup documentation, agent contract fixtures and this setup plan/checkpoint. Setup review and local validation are complete. Reconcile publication with the actual Git state before transitioning to item 72. The same chat owns the active fashion-website-maintainer schedule. Verify ownership before modifying overlapping files.
- Candidate next items are 51, 50 and 57, subject to current severity and user direction.

## Evidence and acceptance

Item 72 is browser confirmed. On /new?sort=featured, checking Size 1 and choosing More filter options removes that draft control. The existing applied URL synchronization fix retains controls that remain rendered.

Preserve intended draft selections across option discovery, explicit removal and Clear Filters. Verify Apply, Back/Forward, committed criteria changes and progressive no-JavaScript GET submission. Read the existing FilterBar and facet-pagination contracts before selecting an implementation.

## Completed and pending work

The preceding shopping-reliability batch implemented 16 items in commit 7984454. Its hosted CI passed at https://github.com/jadnjung/FashionWebsite/actions/runs/43957833531. Those results describe that revision and its recorded environment.

Item 72 has no implementation changes or new validation yet. Resume by inspecting current Git state and the item, then produce a bounded implementation plan and reproduction/regression test. Likely entry points are components/catalog/FilterBar.tsx, lib/catalog/products.ts and tests/e2e-demo/filter-url-state.spec.ts. Expand scope only when the actual contract requires it.

Required implementation, review, validation and publication are pending for item 72. The pre-existing untracked debug.log is outside its scope. No credential or external product dependency is currently known for the placeholder reproduction. The separate daily audit remains paused.

## Scheduled recovery

The app verified fashion-website-maintainer as ACTIVE every 30 minutes in the owner chat. Its November 17, 2026 04:34 UTC continuation recovered interrupted setup after account capacity returned, completed the pending security review and reran local checks. Once setup is published and its applicable checks are verified, change this handoff to item 72 implementation and record its owned files before edits. Use actual account reset windows when available. The app, machine and project must be available for a scheduled run.
