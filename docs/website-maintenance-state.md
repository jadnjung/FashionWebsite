# Website maintenance checkpoint

This file is the current handoff for the website-maintainer agent. The shared backlog remains docs/website-improvement-backlog.md. Follow .codex/WEBSITE_MAINTENANCE.md and AGENTS.md.

## Current task

- Status is ready to publish item 72.
- Active item is 72, preserving unapplied choices across filter-option pages.
- Base revision is 5541a45058337bc4e83f26a7f82de2141aaee37a on surfacebook.
- Current owner is maintenance-item-72-2026-11-17 in chat 01a1d24c-d335-7533-83ac-b1ab13a0c637. The parent owns this checkpoint, task documentation and integration. The frontend specialist owns FilterBar, any required facet control component and focused regression tests after its brief. Setup commit 5541a45 is pushed and matches the freshly queried remote branch. Hosted setup CI is pending. Verify ownership before modifying overlapping files.
- Candidate next items are 51, 50 and 57, subject to current severity and user direction.

## Evidence and acceptance

Item 72 is browser confirmed. On /new?sort=featured, checking Size 1 and choosing More filter options removes that draft control. The existing applied URL synchronization fix retains controls that remain rendered.

Preserve intended draft selections across option discovery, explicit removal and Clear Filters. Verify Apply, Back/Forward, committed criteria changes and progressive no-JavaScript GET submission. Read the existing FilterBar and facet-pagination contracts before selecting an implementation.

## Completed and pending work

The preceding shopping-reliability batch implemented 16 items in commit 7984454. Its hosted CI passed at https://github.com/jadnjung/FashionWebsite/actions/runs/43957833531. Those results describe that revision and its recorded environment.

RED verification completed against the old optimized Demo server. Four focused Chromium tests exited 1 with three expected missing-Size-1 failures in persistence, keyboard recovery and facet history. The enhanced native GET case passed, including Apply followed by option discovery retaining its applied Size 1. Implementation is complete in FacetGroup.tsx, FilterBar.tsx and filter-url-state.spec.ts. The client group retains interacted label/checked state, and the existing server form key resets on committed criteria/sort changes. Unchecked retained controls remain available for keyboard focus and reselection. Native GET guidance explains Apply before option-page navigation with scripting disabled.

The specialist's typecheck, lint, formatting and 44 catalog units passed. Parent full unit process 32806 passed 567 tests, lint process 86343 passed, and optimized build session 90592 passed compilation/TypeScript and the owned local server was stopped after browser validation. All 140 scoped browser cases passed across the five profiles in process 19162, including all 25 shopping-journey checks. Independent code and security reviews found no actionable issue on the current source. The next action is final documentation/format checks, branch-safe publication and matching CI inspection. Stop the owned local server when it is no longer needed.

The existing parser retains at most 20 values per group. An actual parser probe submitted 21 sizes and retained 20, ending at Size 20. This separate guidance gap is logged as item 73 and remains open. The item 72 patch preserves the existing budget.

Item 72 implementation, review and local validation are complete. Publication and hosted CI remain pending. The next candidate is item 51's saved-item refresh work after publication is reconciled, with item 73's new guidance gap considered by impact. The pre-existing untracked debug.log is outside scope. No credential or external product dependency is currently known. The separate daily audit remains paused.

## Scheduled recovery

The app verified fashion-website-maintainer as ACTIVE every 30 minutes in the owner chat. Its November 17, 2026 04:34 UTC continuation recovered interrupted setup after account capacity returned, completed the pending security review and reran local checks. Setup was published as 5541a45 and this handoff advanced to item 72 implementation and validation. Use actual account reset windows when available. The app, machine and project must be available for a scheduled run.
