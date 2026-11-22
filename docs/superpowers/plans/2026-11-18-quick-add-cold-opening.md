# Quick Add opening investigation

Date: November 18, 2026 UTC. Owner: frontend-engineer. Parent owns integration, independent review and publication. Base: `b057d5b98473f3941c8293ac079ed12d6b567e23`, branch `surfacebook`.

## Scope and acceptance

Investigate backlog 76 using optimized, isolated normal Demo and cold browser contexts. Preserve one activation, D-071 dynamic splitting and intent preload, native modal focus restoration, and ten-second API deadlines/late-decoder ownership. No dependency, app probe route, credentials, commit or push. Preserve others' work and unrelated `debug.log`.

Owned source: `components/catalog/QuickAddTrigger.tsx` and focused browser tests. Expand only after reporting evidence to parent. This document records checkpoints before builds and substantive changes.

## Source trace / initial checkpoint

- Initial source unchanged; HEAD matches assigned base. Only untracked `debug.log` existed.
- Hosted reported caller `request-deadlines.spec.ts:150` is the second opening, after Close and restored focus; this is distinct from the backlog's description of an initial opening. The helper always focuses and presses Enter once.
- Trigger dispatches `quick_add_open`, mounts the persistent dynamic panel through `hasEverOpened`, and transitions `open`. Focus/hover preload the module. Installed Next 16.3.1 wraps `ssr:false` loadable in its own Suspense boundary; React 19.2.8 is installed.
- Panel drives native `showModal`/`close` in an effect and unconditionally forwards the asynchronously dispatched native `close` event to the parent's `setOpen(false)`. A queued close event racing a subsequent activation is a hypothesis to test, not a confirmed cause.
- Server ProductCard owns product summary data. Trigger is a small client island; panel owns per-opening API lifecycle, selections and dialog effects. No server contract changes are currently proposed. Collection Closet and looks ring are outside scope.

## Planned evidence

1. Start one pinned optimized normal-Demo launcher with blank integrations; no competing builds.
2. Run unchanged exact deadline case; capture DOM click/keydown/close/open transitions, analytics receipt, busy state, request timing and console/page errors using test-side instrumentation.
3. Exercise cold initial scripts and dynamic chunk delay separately, then ordinary pointer. Never repeat activation to mask failure.
4. If a hypothesis reproduces, record actual RED, add focused behavior regression, apply the smallest app or supported-state harness correction, then rerun focused cases and checks.
5. Return hashes, sessions, commands, outcomes and limits to parent for independent reviews and integrated validation.

## Validation

### Baseline evidence checkpoint (before app edits)

- Optimized launcher session `71245`: build and TypeScript succeeded, normal-Demo server ready on 3000. Explicit isolated environment via `run_project.py exec node scripts/run-browser-server.mjs`.
- Exact unchanged mobile-Chrome close/reopen case, session `77330`, `--repeat-each=10 --workers=1`: 10/10 passed (26.9s). This does not establish hosted root cause.
- Test-side diagnostic `node_modules/.cache/quick-add-probe.mjs`, session `79482`, cold Pixel 7 contexts: normal keyboard opened/reopened; pointer opened; controlled 1.5-second dynamic JS delay opened from one Enter. No page/console errors.
- All-initial-JS-held diagnostic: one SSR Enter before hydration produced DOM click but no analytics receipt/open, then remained absent after JS release. This is a distinct prehydration limitation, not an explanation for the hosted second opening. No scope expansion for it.
- Dynamic-delay diagnostic: click/analytics at 229ms, busy true 233ms, busy false 252ms, dialog opened 1753ms. Installed Next's inner Suspense means current aria-busy does not cover the entire chunk wait. This is separate from the reopen race; do not bundle a speculative loading redesign.
- **Controlled notification-replay RED:** intercept the first native close event in test capture, retaining native `dialog.close()` and focus restoration; activate trigger once again; dispatch a synthetic equivalent `Event('close')` notification. Telemetry receives both intended opens. Dialog second opens at 644ms, replayed old notification arrives at 680ms with `dialog.open=true`, unconditional panel onClose clears parent open, dialog closes at 684ms. No errors. Probe result: `opened / reopen absent` after five seconds. The native event is queued after focus restoration; controlled replay exercises that ownership boundary deterministically. This is not a natural hosted reproduction.
- Baseline SHA-256: trigger `377895de9406b48cdeacdc47fb89d9cbcd585b67fb00d45df6c7017c840d78b5`; panel `67bc098bcf1846dad99436958eaad381f8cdb9b4cf58ae3eb2aaccbb31fe7fa6`; deadline test `86b60d3e4423cdde9c784b74285a5682d920c769dbc8c7ff201db49e29aed1c1`.
- Parent informed and conditionally authorized panel scope when queued-event defect proved. Next: focused delayed-native-close regression RED before minimal app fix. Hosted cause remains a supported hypothesis until matching evidence exists; controlled local app defect is reproduced.

### Regression RED checkpoint

New behavior test `a delayed native close event cannot dismiss a newer Quick Add opening` retains real native close/focus and per-opening fetch behavior, intercepts only the native notification, opens once again, then replays a synthetic equivalent notification after the new dialog is visible. Rendering is observed after two animation frames, without repeated activation or timeout extension. Session `23493`, optimized unchanged app, mobile-Chrome: **1 failed**, expected visibility assertion at line 194; newer dialog absent after the replayed old notification. Parent approved minimal panel scope based on this evidence.

Next app edit: ignore a native close notification when `event.currentTarget.open` is already true. Genuine Escape still has `open=false` and updates parent state. No new state/effect, import, copy, motion or API changes.

### Capacity / edit checkpoint

Parent reports actual primary 95%, weekly 94%, ordinary allowed. Current source edit is the four-line `onClose` guard in `components/product/QuickAddPanel.tsx`; `QuickAddTrigger.tsx` remains unchanged. Test file contains the new delayed-close regression. **GREEN not yet run.** Existing optimized server session `71245` was stopped with Ctrl-C (exit 1); no listener was returned by the immediate port-3000 query. CIM process query was unavailable without escalation. No server is intentionally running; next owner must check port/process state before building.

Next: targeted prettier on test/source/document, one pinned optimized normal-Demo rebuild, GREEN delayed-native-close case, then exact/relevant browser cases across supported profiles, lint/typecheck/unit checks. Parent arranges independent read-only security and quality review, integrated verification, and publication. Retain ignored diagnostic script/results at `node_modules/.cache/quick-add-probe.mjs` and `node_modules/.cache/quick-add-probe-results.json`. No commits/pushes performed.

### Verification checkpoint

Optimized patched build session `68367`: compiled, TypeScript passed (6.1s), static generation passed, server ready on 3000. This session currently owns the normal-Demo server. Targeted ESLint session `63204`: exit 0. Full unit suite session `23824`: 692/692 tests across 64 files passed, exit 0 (existing Vite future-config/deprecation warnings only). Source/test prettier exit 0. `git diff --check` exit 0; existing fsmonitor transport diagnostic and LF/CRLF advisory observed.

Panel SHA-256 `77ccfab4df578e2a2742a5836b0617bc65abc810284df7ad275f034d52c93a30`; test SHA-256 `83b9786f24bf0156945a5c0dd8a8e38c615f4029cc5b541b7d1b16b5477a625a`. Parent's independent security review reports clean for these hashes. Repeated reopen browser run `56532` is in progress: both relevant cases, all five profiles, repeat-each 5, workers 2, expected 50 cases. GREEN not yet claimed while it runs.

### Recovered GREEN checkpoint

Capacity returned (parent: primary 1%, weekly 95%, ordinary allowed). Recovered session `56532` exit **0**, **50/50 passed** (1.7m): existing close/reopen plus controlled notification-replay regression, five repeats each across Chromium, laptop, tablet, mobile Chrome and mobile Safari. Session `13951` standalone compiler exited **0**. Session `68367` remains active with no new output/errors. Source/test hashes rechecked unchanged. Next: scoped deadline, Quick Add variants, shopping and nested-dialog interaction checks against this same isolated optimized server, then stop the server and hand off.

Broader scoped browser session `10299` is running 90 cases (18 per profile) from request-deadlines, variant-fixtures, shopping-journey and navigation-accessibility, grep `Quick Add|transport interruption|complete local shopping journey`, workers 2. This includes real single pointer/touch opening without preliminary focus, native Close/Escape restoration, nested Search Tab/Escape ownership, missing/sold-out variants, retries, ten-second fetch/body deadlines, late-result selection ownership, bag handoff and quantity/amount telemetry. No result claimed until final exit.

### Pending-opening boundary checkpoint

Session `10299` completed exit **0**, **90/90 passed** (2.2m), on the simple DOM-open guard. No source/test edits during that run.

Further controlled timing probe `node_modules/.cache/quick-add-pending-close-probe.mjs` demonstrates the guard is incomplete. Initial experiment releasing a notification from a button listener ran before React receipt (event-listener microtask checkpoint); it opened, and does not test the intended boundary. Refined experiment queues replay from the next `esque:analytics` receipt instead, then uses a real single `trigger.press('Enter')`. Second handler receipt at 1168.8ms; replay at 1169.1ms while `dialog.open=false`; new opening absent after five seconds. Thus an already-accepted transition can still be cancelled before its dialog effect commits. This is another controlled notification replay, not natural hosted reproduction.

Parent informed before further source edits. Proposed minimal ownership fix: a ref counts programmatic `dialog.close()` notifications, incremented in the existing close effect; onClose consumes them as redundant because parent state has already closed. Retain DOM-open protection for stale native notifications and genuine native Escape synchronization. Add pending/visible replay timing cases and observe pending RED on current simple guard before changing app. No additional hydration/loading scope.

### Second regression RED / refinement checkpoint

Parent approved ref-counter refinement, consumed before DOM-open check and incremented only immediately before an actual guarded `dialog.close()` call. Parameterized browser regression now covers `during the transition` and `after the dialog opens`. The pending case queues a synthetic notification replay from the real next `quick_add_open` receipt, then performs one real Enter through the existing helper. Session `79855`, mobile Chrome on simple guard: **1 failed**, expected helper visibility failure at line 21, caller 205. This matches the externally observed absent-dialog assertion boundary, but remains a controlled local replay rather than proof of hosted event ordering.

Next source edit adds one ref count, its increment in existing close effect, and its consumption before existing DOM-open guard. Earlier security hashes are superseded by the upcoming source/test edits. Current server `68367` still serves the simple-guard build and must be stopped before rebuilding. No commit/push.

### Refined source checkpoint

Ref-count implementation applied and formatted. Panel SHA-256 `968c7c47c4b10e9003b99f27350267d3c2f06f86ebfe2f67446b221246cc72d5`; parameterized test SHA-256 `9c4e9d7258f85164ec98dd64da626ffeadec8bb89f9c8835a37680a9aebe94bd`. Parent notified for fresh independent review. Old server `68367` stopped with Ctrl-C, exit 1. New pinned optimized launcher session `90604` is building (startup slower than earlier), no success claimed yet. Targeted ESLint session `19305` pending. LSP diagnostics returned `Diagnostics are not ready; retry`, not a clean result. Source/test hashes rechecked unchanged.

Refined optimized build `90604` now compiled successfully (31s), TypeScript passed (27.1s), static generation passed, server ready on 3000. Final repeated browser session `79568` is in progress, expected 75 cases: existing reopen plus both notification-replay timings, five repeats across all five profiles. No success claimed yet. Targeted ESLint `19305` still pending without output; do not start competing lints or builds.

Final repeated run `79568`: exit **0**, **75/75 passed** (2.3m). Both timing regressions and existing fresh-session/selection behavior pass across five profiles, including genuine Escape/focus assertions after replay. Final targeted ESLint `19305`: exit **0**. Three-path prettier and scoped `git diff --check`: exit **0** (existing fsmonitor/LF advisory only). Next: final broad 95-case affected journey sweep on the same refined build, then server stop and handoff.

Final broad session `80426` is running 95 cases on refined server `90604`, same four affected spec files and grep as the earlier 90-case run, with the additional pending replay case per profile. Source diff remains 13 additions/1 removal in panel and 63 test additions. Trigger unchanged. LSP diagnostics still not ready; production compiler is the completed type evidence. Parent owns final independent security/quality review and integrated checks; hosted failure ordering and hosted final result remain unverified.

### Final implementation handoff

- Final broad session `80426`: exit **0**, **95/95 passed** (2.4m), all five profiles. Together with repeated session `79568`, **170 final-refinement browser checks passed**. Earlier simple-guard results are separate historical evidence, not counted in the final total.
- Final build `90604` succeeded with production TypeScript. Final targeted ESLint and three-path formatter passed. The full 692-test unit run and standalone compiler noted earlier predate the ref-counter refinement; parent owns integrated final static/unit validation rather than treating those earlier unchanged-scope results as fresh final-refinement checks.
- Final source/test hashes remain `968c7c47c4b10e9003b99f27350267d3c2f06f86ebfe2f67446b221246cc72d5` / `9c4e9d7258f85164ec98dd64da626ffeadec8bb89f9c8835a37680a9aebe94bd`. Parent owns final independent security/quality re-review for these hashes.
- `QuickAddPanel.tsx:49,66,149` owns redundant prop-close notification count and consumes it before native DOM-state reconciliation. `request-deadlines.spec.ts:163` adds controlled replay before/after opening commit. TypeScript references confirm the panel's only component caller is the existing lazy import in `QuickAddTrigger.tsx`; props are unchanged.
- Server `90604` stopped with Ctrl-C after the final run (launcher exit 1 is intentional shutdown). No commit/push or external integration was performed. Parent can take sequential runtime ownership after verifying released port/process state.
- Escalated post-shutdown check returned no port-3000 listener and no matching Next launcher/Next/PostCSS Node processes (exit 0). Runtime is released. Final plan formatter passed and final source/test hashes were rechecked unchanged.
- No backend contract/data change, new dependency, render state, effect, copy, style or animation. D-071 split/preload/persistent mount and per-opening ten-second request ownership remain intact. No backend-engineer work is required for integration.
- Controlled replay proves a local app event-ownership defect and its correction. It does not establish the exact natural ordering in hosted CI; observe matching hosted validation and recurrence evidence before declaring the original hosted cause proven. Separate initial-JS and chunk-busy findings remain parent backlog items 79/80.


## Parent integration

Parent primary review and mandatory security re-review cleared the final counter/test bytes at panel SHA-256 968c7c47c4b10e9003b99f27350267d3c2f06f86ebfe2f67446b221246cc72d5 and deadline spec 9c4e9d7258f85164ec98dd64da626ffeadec8bb89f9c8835a37680a9aebe94bd. Parent unit run 3316 passed 692 tests across 64 files in 9.58 seconds; final typecheck passed. Parent full lint/format run 23055 is pending. Architecture, roadmap and backlog describe final ownership and the limits of controlled replay evidence. Publication and matching hosted verification follow only after final checks.


Parent full lint/format 23055 completed exit 0. Final integrated checks are clean; no source bytes changed after reviewed fingerprints. Governance/planning prose is excluded by formatter policy and is validated separately through local links, backlog numbering and diff whitespace.


## Publication

Verified branch exactly surfacebook before commit and push. Published 8cbfb99120e8f2dc7641d29399e0ff3d27e02e99 with explicit destination and fresh exact remote match. Final structural check passed 218 local links and 82 numbered backlog entries, alongside reviewed source hashes. Matching CI 44309969021 is in progress. Root continues item 75 harness lifecycle repair next; exact natural hosted ordering of item 76 remains unconfirmed pending matching evidence.


## November 21 hosted follow-up: native Escape

Matching run 44309969021 at 8cbfb99 completed with failure in the known legal sweep. Demo completed 883 passes/23 skips and three recovered reopening failures on Chromium, laptop and mobile Chrome. The caller is line 158, the third activation after Escape at line 156; the Close-button reopening at line 150 succeeded in those attempts. Keep item 76 open.

Read-only frontend trace identifies a distinct ownership gap: native Escape can close the DOM dialog and restore focus before its queued close event reconciles the parent's open prop. A subsequent setOpen(true) may have no false-to-true edge while that prop is still true. The counter covers effect-driven programmatic closes, not this native Escape notification. This remains a hypothesis for the hosted ordering.

After the legal worker releases runtime, reproduce the three-opening journey with native Escape and controlled close-notification capture/replay, one activation and preserved native focus/decoder behavior. Record actual RED before editing. Candidate only after proof: onCancel prevents default and synchronizes controlled close, letting the existing effect call native dialog.close() and balance the notification counter. Preserve both programmatic timing regressions, consecutive Escape/reopen, fresh selections/requests and nested Search Escape ownership. No new state/effects/dependencies or loading/readiness scope expansion is proposed. [HTML dialog close algorithm](https://html.spec.whatwg.org/multipage/interactive-elements.html#close-the-dialog)
