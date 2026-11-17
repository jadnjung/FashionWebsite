# Facet draft persistence implementation plan

Complete backlog item 72 from surfacebook revision 5541a45. Preserve the existing server catalog and applied URL contract while keeping checked options available across filter-option pages.

- [x] Reproduce a Size 1 draft disappearing after More filter options on the old optimized Demo build.
- [x] Add a small client facet-group island inside the existing native GET form. Keep interacted value/label/checked state in the group and merge missing interacted options into the currently offered options. Use the server form key to reset on committed criteria/sort changes.
- [x] Verify explicit unchecking, multiple draft choices, facet history, Clear Filters, sort/chip navigation and native submission. Preserve progressive GET behavior, including applied selections with scripting disabled. Document that unsubmitted no-JavaScript choices require Apply before navigating option pages.
- [x] Run applicable formatting, compiler, unit, optimized-browser and complete shopping-journey checks. Obtain quality and security reviews, resolve confirmed findings and review fixes.
- [x] Update the backlog, current checkpoint, roadmap, rendering architecture and durable decision.

Publication follows AGENTS.md with task-owned staging, the exact surfacebook branch check before commit/push, an explicit destination and inspection of matching CI evidence. The checkpoint tracks the current publication stage.

The frontend specialist owns FilterBar, the facet-group component and focused regression tests. The parent owns documentation, integration and publication. No persistent browser storage, dependency or server-query contract change is planned.

## Execution evidence

Four focused Chromium cases on the old optimized Demo build exited 1 after 54.7 seconds. Three expected failures reproduced the missing off-page Size 1 control during persistence, keyboard recovery and facet history. The enhanced native GET case passed, including applying Size 1 before continuing option discovery.

The selected design retains unchecked interacted rows as well, preserving keyboard focus and reselection. FacetGroup holds a single Map of labels and checked values. Current options and interacted values are deduplicated into native named inputs. Summary counts retain the applied-filter meaning. The existing form key resets the client islands on committed criterion or sort changes. The native GET fallback is explained beside pagination.

Specialist checks passed compiler, focused lint/formatting and 44 catalog units. Parent integration passed all 567 units, full lint, the optimized production build with TypeScript validation, and 140 browser cases with two workers in 2.3 minutes. Browser coverage spans Chromium desktop/laptop/phone and WebKit tablet/phone. It includes off-page size/color drafts, submission deduplication, keyboard unchecking/reselection/focus, facet history, Clear Filters, committed URL reset, no-JavaScript Apply/continuation, accessible filter dimensions, catalog continuation and all 25 full-shopping-journey cases. Page-error assertions passed.

Independent quality review found no confirmed issue and verified actual-component server rendering. Security review found no actionable introduced finding in React-escaped labels/attributes, in-memory state, fixed form names and preserved server parsing/query budgets. No storefront dependency, browser-storage or server-parser change was introduced.

A separate actual-parser probe submitted 21 distinct sizes and retained 20 without budget guidance. This pre-existing gap is source confirmed and logged as open item 73. The current patch preserves that existing supported budget and records the boundary for later work.
