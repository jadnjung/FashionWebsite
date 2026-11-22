# Demo Countdown Clock Repair Implementation Plan

> **For agentic workers:** Execute this scoped repair using superpowers:executing-plans and test-driven-development. Parent owns integration, browser runtime, security review and publication.

**Goal:** Keep the sample upcoming Demo collection usable when the calendar advances while preserving authoritative release timing.

**Architecture:** Capture one seven-day release deadline when the Demo fixture module initializes. Summary and detail use that same immutable ISO timestamp; reads never extend it. Real Shopify data, server clocks, drop-phase calculation and countdown behavior remain unchanged.

**Tech Stack:** TypeScript, Vitest, existing Playwright Demo suite; no dependency changes.

**Spec:** PROJECT.md §42, ROADMAP.md Phase 11 upcoming-drop contract, and parent-approved November 21 scoped fixture repair below.

## Discovery and accepted design

Published revision `f5d95e913e1695052a6f33a55f713bd215633235` carries `2026-11-20T12:00:00Z` in both Collection 002 summary and detail. `getDropSnapshot` correctly classifies that date as current on November 21, so the collection route renders products. The countdown browser test sets only the client clock to 2099; this cannot make a past server release upcoming. Its missing-countdown assertion therefore follows from expired Demo data.

The isolated browser runner pins external integrations but does not override server time. Normal suites own their server (`reuseExistingServer: false`); explicit external reuse checks mode/profile/render markers. No server or build is authorized for this specialist task.

Considered alternatives: another absolute future date merely delays recurrence; a production/server clock override broadens the contract unnecessarily; a browser-only fixture profile adds infrastructure without repairing the ordinary Demo preview. Parent accepted one module-scoped relative Demo deadline. A new process/module initialization starts a fresh sample release; a running module can still reach its deadline. This is Demo behavior, not a real launch schedule.

## Constraints and review focus

- Own only this record, `lib/shopify/preview-demo-fixtures.ts`, and its existing `.test.ts`; preserve concurrent edits.
- Retain fixed helper-unit dates and their injected/fake clocks, including freshness and exact release-boundary checks.
- Test initialization in 2026 and far-later years; deadline equality and stability must hold across summary/detail rereads.
- Recalculating a deadline inside a getter must fail the no-drift/boundary regression.
- Preserve the real browser countdown test: skew, monotonic elapsed time, one RSC refresh, fresh server countdown, and zero withheld-product leakage.
- No credentials, external writes, builds, servers, commits or pushes in this assignment. Parent performs required security review and integrated browser acceptance before completion.

## Task 1: Repair the sample release deadline

**Files:** fixture module and its existing unit test, as above.
**Interface:** `PREVIEW_COLLECTIONS`, `getPreviewCollections()` and `getPreviewCollectionDetail(handle)` retain their current types; only the sample Collection 002 date changes.

- [x] Add parameterized tests with fake clocks and fresh module imports at November 21, 2026, 2040, and 2100. Assert a seven-day deadline, identical summary/detail dates, and upcoming classification.
- [x] Reread through the same module after advancing time; assert the date never moves and `getDropSnapshot` switches from upcoming to current exactly at the deadline and stays current afterward. Restore clocks/modules in `finally`.
- [x] RED: run `python .codex/tools/run_project.py test:unit lib/shopify/preview-demo-fixtures.test.ts`; require the new cases to fail on the expired date rather than setup.
- [x] Replace both absolute sample dates with one module-scoped seven-day timestamp. Update the stale future-date comment.
- [x] GREEN: rerun the focused fixture tests plus `lib/collections/drop-phase.test.ts`, `lib/home/upcoming-drop.test.ts`, and `lib/home/find-collection.test.ts`.
- [x] Run typecheck, targeted ESLint and targeted Prettier. Parent owns full integrated checks and browser execution after runtime coordination.
- [x] Return exact results, source hashes, remaining runtime prerequisites and diff ownership to parent.

## Execution evidence

Read-only prerequisite check: isolated runtime is Node 22.23.5 / pnpm 11.22.0 with application dependencies present. Initial source analysis only; no local browser execution yet. Hosted failure counts are parent-supplied public-run evidence, not a reproduced local browser result.

Windows local RED: 20 existing fixture tests passed and all three new parameterized cases failed on the old November 20 date. GREEN: 49 tests passed across the four focused files. Full unit self-check: 695 passed across 64 files in 20.53 seconds. JSON reports are ignored under `playwright-report/diagnostics/countdown-clock/{red,green,full-unit}.json`. All use the isolated runner above; focused/full commands add `--reporter=json --outputFile=<report>`.

`typecheck`, targeted ESLint, targeted Prettier and `git diff --check` passed. Existing Vite configuration/plugin notices remain; no configuration changes were made. TypeScript LSP returned a clean incomplete test-file snapshot and a not-ready source-file snapshot; the completed compiler check supplies the type result.

Frozen SHA-256: fixture source `eeb0cfe82e5b0e52c09250b1a4051fc0049511b56a26d34e9d6fdda6a3f137e3`; fixture test `59dde9344dde0bbe71e54ece1d6c58a28451468aee6b71aca94c031609344c2c`.

Pending parent acceptance: optimized build and original `tests/e2e-demo/drop-countdown.spec.ts` on Chromium 1280×720, Chromium laptop 1024×768, Pixel 7 Chromium, iPad Mini WebKit and iPhone 13 WebKit. Existing assertions must pass without changes: visible upcoming countdown despite client 2099, no initial refresh, exactly one refresh after elapsed time crosses the deadline, fresh server countdown, no repeated refresh and no withheld products in DOM/RSC. No local browser, responsive, keyboard, reduced-motion or real customer mutation checks were executed by this specialist. No store or external account access is needed for this fixture repair. Required security review, integrated validation and branch-only publication remain parent responsibilities.


## Parent integrated acceptance

Optimized isolated Demo build/server 29232 compiled and completed its compiler/build successfully. Parent ran the unchanged drop-countdown.spec.ts on all five profiles, retries zero: 5/5 passed in 6.2 seconds. This exercises skew, one real refresh, refreshed countdown and withheld-product exclusion. Parent full shopping-journey.spec.ts run 21587 passed 65/65 in 1.3 minutes across all five profiles, including choices, recovery, quantities, telemetry and no-script product browsing. Parent unit run 78393 passed 695/64 files in 13.34 seconds; full lint, format and compiler chain 35126 exited zero. Existing Vite notices remain unchanged.

Root primary review confirmed one stable module deadline, matching summary/detail, exact release boundary, unchanged real Shopify phase logic and environment restoration. Native security-engineer reviewed the complete two-file diff at the frozen hashes above and reported no actionable findings. No source edits followed review. The new date sample is scoped to Demo fixtures; a newly initialized process begins a fresh seven-day sample. Matching hosted verification will follow publication and is not claimed here.


## Publication and hosted acceptance

Published 560e90d239491b776028de317283873541ac8476 only to surfacebook; fresh remote matched. Matching CI 44992919768 completed SUCCESS. Unconfigured645/15 skips and collections 61/9 skips passed. Demo 889/23 skips passed with two recovered tablet cases: filter-selection-budget line88 lost19 expected submitted choices, and shopping-journey line58 encountered a closed page/context/browser. Countdown itself passed;86 is closed. The distinct recovered cases are logged in the backlog for investigation, without assigning an unproven application cause.
