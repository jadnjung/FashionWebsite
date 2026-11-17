# Collection index continuation

This plan covers backlog item 50 after published maintenance commit ce7156c. Discovery was read-only. Implementation has started after the RED milestone.

## Existing contracts

getCollections already accepts a source cursor and returns page metadata, but the collections index, archive helper and homepage selectors discard continuation. Default Demo fixtures contain five collections, with existing tests depending on those counts. Preserve that default fixture contract while adding isolated larger scenarios.

Reuse the normalized cursor rules in lib/shopify/pagination.ts, native navigation patterns from CollectionPagination and bounded scan/deadline guards from lib/catalog/products.ts. Preserve lifecycle routing, collection-scoped access, homepage fallback behavior and 60-second content freshness.

## Implementation sequence

1. Reproduce the lost later-page archive/current/upcoming entries with 21 and 45 synthetic collections before source changes.
2. Extend collection reads with cancellation and validate continuation metadata. Preserve existing positional callers and SDK retry policy.
3. Retain source continuation in the archive result. An empty filtered intermediate page must keep navigation and describe its page scope accurately.
4. Add bounded homepage first-match scanning with a shared ten-second deadline, visited-cursor detection and explicit scan budget. Budget exhaustion and malformed continuation must reach existing error handling.
5. Add native collection/archive Next and First page links, normalized cursor input and matching canonical/Open Graph destinations. Coordinate server result contracts before changing UI callers.
6. Add an isolated 21/45-collection fixture profile whose synthetic handles also resolve through detail helpers. Keep normal fixtures stable.
7. Review and validate lifecycle/access boundaries, failure recovery, keyboard/history/no-JavaScript navigation and unique reachability before updating completion status and publishing.

## Acceptance and evidence

- Collections traverse 20/20/5 entries exactly once for the 45-entry scenario.
- Archive navigation reaches an entry after the first page, including through an intermediate source page with no archived entries.
- Empty messages distinguish page scope from genuine first-page exhaustion.
- Homepage selectors find eligible current/upcoming collections after entries 20 and 40 while retaining existing first-match policy.
- Later failures, repeated and cyclic cursors, malformed connections, cancellation, deadlines and scan budgets fail intentionally and recover on a fresh attempt.
- Existing unconfigured-store and default Demo behavior remain covered.

The backend discovery found no existing large-collection scenario selector. Browser-side transport interception cannot replace server-rendered collection reads. No application source, fixture or test changes for item 50 have been made yet.

## RED milestone

Before application edits, lib/home/collection-continuation.test.ts failed all four focused cases for the intended gaps. A 45-entry collections index had no Next link, the archive falsely showed its initial empty message despite an archived entry at position 21, the closet returned null for a current collection at position 41, and the upcoming selector returned null for a collection at position 21. Reference inspection found ArchiveIndex and tests as the supported getArchivedCollections callers, so that existing API will migrate to the paged result.

## Core implementation milestone

The four RED cases now pass, together with 61 focused unit tests and typecheck. Core changes include normalized native index/archive continuation and canonical/Open Graph paths, the paged archive result and bounded homepage first-match scanning. Existing SDK abort transport patterns are reused. Isolated large-fixture, guard and browser coverage are still being completed. Primary quality and security reviews have begun on the core diff. Dedicated scenario configuration must reuse existing Demo settings, pin its profile, clear ambient scenario state from default suites and execute in CI.

## Scenario and review progress

The continuation-21 fixture now has 20 non-archived collections followed by one archived collection, verified through actual fixture-backed archive paging. The 45-entry scenario includes the empty intermediate archive page. Review found a browser selector for unrelated Hoodie/Oversized titles and it was corrected to the canonical crewneck destination. Independent review ran 72 focused core tests and four fixture/metadata cases successfully. The specialist reported a full 596-test/59-file unit pass before the latest small fixture correction, so that evidence needs affected-scope verification afterward.

The first optimized scenario run 24521 stopped before browser execution with a Turbopack globals.css child-process creation panic. A sequential retry reproduced the cached panic. No browser success is claimed. The specialist is retrying after verifying and clearing only the repository-contained generated .next output, with escalated runtime permissions required for local process/loopback execution. Capture the actual final result before deciding whether this is an environment or application failure.

## Optimized browser recovery

After the process-creation failures, a direct pinned production launch with inherited NO_COLOR removed completed the normal Turbopack build successfully. No webpack fallback or tracked build configuration change was used. Server 53333 is owned by the fullstack specialist and its Demo-45 identity was verified. Browser run 41493 is executing 25 cases across five profiles against that server. The final exact PDP heading assertion now matches Featherweight Crewneck Sweater. Capture the final exit/counts and source manifest before review closure.

## Final scenario and integrated checks

The first scenario run passed 20 and failed five identical teaser-heading assertions. The UI renders that heading in uppercase, so the exact assertion was corrected from the actual component/snapshots. Final run 47622 passed all 25 checks across five profiles in 34.2 seconds. No application source changes followed the successful optimized build. Independent quality and mandatory security reviews are clear on the final 26-file manifest 744e3fcecc799efb78cfbd7a88389258eb5339c7d28dd9610e4d6777aab4c6c7. Browser spec hash is 19c613674dcaf5476d004fde820a6fb503c42fcdf55d7d7e2fb8fbdd796d79c2.

Parent integrated full unit run 90893 passed all 596 tests across 59 files after the final fixture corrections. Full lint 33094 and typecheck 97401 passed. The scenario server was stopped. Parent now owns default Demo optimized build/server session 21364, with scenario explicitly cleared and inherited NO_COLOR removed from this invocation. Default-data browser regression remains pending.

Parent default Demo optimized build 21364 passed. Its integrated browser run 80362 passed all 69 cases in 6.8 minutes, including existing Closet interactions, countdown, SEO and all shopping-journey cases across the applicable profiles. The server was stopped. Parent unconfigured optimized build/server 76707 is now starting for focused archive/index error-recovery checks with both Demo and scenario flags explicitly cleared.

## Final local validation

Parent unconfigured optimized build 76707 passed with Demo/scenario flags cleared. Its archive/index browser run 86628 passed all 28 cases in 13.6 seconds, including intentional runtime failures, metadata and sitemap reachability. The owned server was stopped after verification. Full formatter check passed. Final scope has 596 passing unit tests, 25 large-fixture browser cases, 69 normal Demo cases and 28 unconfigured cases. Both independent reviews are clear on the unchanged final application/configuration/test bytes.

The dedicated regression command is `pnpm test:e2e:collections` with `PLAYWRIGHT_PRODUCTION=1`. Local Windows verification used the documented direct pinned server plus `PLAYWRIGHT_EXTERNAL_SERVER=1` after managed-build IPC failures. The same normal Turbopack engine completed the scenario, default Demo and unconfigured optimized builds. No tracked build-engine workaround was introduced.

Backlog item 50 is implemented and locally verified. ROADMAP, ARCHITECTURE and D-101 record the delivered contracts. Final publication and matching hosted CI remain pending. Physical-device and connected-store verification retain their existing owner/environment dependencies.
