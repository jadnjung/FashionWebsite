# Drop-grant signal lifecycle, item 53

## Scope and starting evidence

Continue from published Search revision e1e4ac8dad8fd42871db59558d4a2effe5b87859 on surfacebook. Its hosted CI 44123444619 remains in progress. Preserve the unrelated debug.log and Claude compatibility files.

The backlog reproduces a grant signal set after ShellClient mounted remaining unconsumed through ordinary client navigation. Current source consumes the optional cookie only in a mount effect. The actual successful server action sets both the authoritative httpOnly unlock cookie and optional short-lived analytics signal, then redirects to the same collection URL. DropAccessForm retains a bound server action through useActionState, including native form serialization and no-JavaScript behavior. The locked teaser is replaced by CollectionView after success.

A pathname-only observer could repair ordinary route navigation while still missing the real same-path unlock transition. Preserve progressive enhancement, server-side authorization and the existing grant cookie schema. Avoid polling, changing URLs just to trigger analytics, exposing the code, adding production test endpoints or treating the analytics signal as authorization. Cookie consumption must clear before emission, including malformed optional state, and must allow a genuinely later grant for the same handle.

## Acceptance and verification

- Reproduce the current in-session missing event through normal client navigation before implementation.
- Initial load, an already-mounted grant and the same-path successful action transition each emit once for the grant and clear the optional cookie.
- Later ordinary navigation, history and reload do not duplicate consumed grants. A new grant can emit again.
- Invalid signals remain harmless. Wrong-code submission produces no grant or access change. Submitted code values never enter analytics.
- Verify the actual form transition with an isolated, clearly identified successful-action simulation if a real configured action environment is unavailable. Keep server action unit tests as separate evidence; a synthetic cookie alone does not prove the form lifecycle.
- Run focused regression first, then applicable integrated lint/typecheck/unit/browser checks and mandatory security fix review before branch-only publication.

## Ownership and status

Parent owns integration and documents. Analytics specialist confirmed the minimal lifecycle design: one reusable null client observer, a root pathname subscriber and a mount in the server-approved CollectionView subtree. Both synchronously read, clear and emit, preserving once-only consumption without global handle deduplication. Fullstack specialist collection_continuation_implementation owns observer/helper, ShellClient, CollectionView and focused regressions, including browser/build resources. Failing regression remains the next step; no new application edits were present at assignment. Existing item 57 publication records are independent of this task.


## Lifecycle edge cases under design review

Query-only navigation is also a supported transition, so root observation must use a scalar query value as well as pathname, within the existing Suspense boundary to preserve static rendering. Successful grant followed by a product-render error or not-found response must not depend on CollectionView mounting. Before runtime edits, compare explicit success/error observer mounts against a shared cookie-consumption call during DropAccessForm unmount. The latter would dispatch only when a real optional signal exists, never because teardown itself implies success; actual cookie timing and React cleanup behavior need validation. Avoid expanding to brittle Flight payload injection if the actual action and normal component lifecycle provide sufficient evidence.

The implementer is preparing RED navigation coverage and an isolated real-action fixture build with fixed public synthetic code, all real integrations empty and Preview capture enabled. Stable demo-collection-021 avoids the default fixture's November 20 release date. Default runner empty-code isolation remains intact. Fresh account usage at assignment follow-up was primary 76%, weekly 44%, ordinary usage allowed. Preserve a recoverable checkpoint if capacity stops work.


## Selected minimal design

Analytics review recommends one shared guarded synchronous consumer, one root path/query observer within existing Suspense, and DropAccessForm unmount cleanup invoking that same consumer. A completed action's response cookies are applied before its Flight update removes the hydrated form, so cleanup can consume the existing signal across success, error or not-found rendering. Cleanup is not evidence of success: absence of a signal means no dispatch. Clear before dispatch handles overlapping observers and StrictMode rehearsal; catch optional cookie access/write failures so analytics cannot interrupt teardown. No CollectionView/error islands, form-action wrapper or new action result type is needed.

A never-hydrated/no-JavaScript form has no cleanup; native redirect preserves form operation and a later hydrated root consumes the signal. An abandoned in-flight response whose signal arrives after unrelated teardown remains best-effort until the next observation. Keep this boundary explicit rather than adding polling. [React effect lifecycle](https://react.dev/reference/react/useEffect), [Next cookie behavior](https://nextjs.org/docs/app/api-reference/functions/cookies#understanding-cookie-behavior-in-server-functions)


## RED milestone

Unchanged-source normal Demo server 76574 reproduced the bug in browser session 16623, exit 1. A grant signal added after hydration followed by the real BAG client link retained the same document-session marker, but captured grants remained empty instead of containing collection-002. The test therefore isolates the persistent-shell lifecycle defect rather than a document reload or missing Preview capture. The old server is being stopped before runtime edits. Shared consumer/root observer/form cleanup implementation is next; no GREEN or final review is claimed.


## Saved implementation handoff near capacity

The fullstack specialist saved the chosen consumer/observer/cleanup implementation in seven owned paths. Focused consumer/cookie/action/message units passed 37/37, final typecheck passed and source formatting completed. Authoritative action/cookie settings and native form binding remain unchanged. Server 76574 is stopped; no worker server remains active. The existing .next output is pre-fix and must not be reused as GREEN evidence.

Next rebuild the normal Demo profile and rerun cookie-recovery, then write and execute the isolated real synthetic-code Demo45 action/no-JavaScript harness. The latter is not yet written. Quality review, final mandatory security review and parent integrated checks remain required before publication. An interim security review was requested, with its outcome pending. At checkpoint account usage was 96% primary/47% weekly and ordinary use still allowed; do not claim a real limit was reached merely from that reading.


## Capacity recovery and integrated checks

Both implementer and interim security reviewer subsequently hit the actual usage restriction. Scheduled continuation recovered ordinary usage with primary 6% and weekly 49%. The actual working tree also retained tests/e2e-collections/drop-grant.spec.ts, written after the old handoff. That saved actual-action/no-script harness is reused.

Published Search CI 44123444619 completed SUCCESS at exact e1e4ac8. Item 53 normal Demo optimized build/server is implementer-owned session 15415. Parent integrated unit run 52534 passed 635 tests across 62 files and typecheck 53223 passed. Parent lint 10996 remains running. These checks cover the saved source before any subsequent fix.

Mandatory security review completed against the eight-path source/test scope with no actionable finding. Its snapshot fingerprint is d0266450c386ebb32358dca85c18b423087b412823301c9021885d170597530f. It confirmed optional cookie clearing precedes dispatch, client signals grant no access, and server action/cookie authority has zero diff. Launcher isolation and real browser lifecycle remain runtime checks. Primary quality review is in progress.


Parent integrated checks passed 635 units across 62 files (52534), typecheck (53223), full lint (10996) and whole-repository formatting. Primary review found no actionable issue in the eight-path source/test scope, ran 37 focused tests and passed diff checking. Its separate manifest is 404297b3b1d0eb262f81fde68384e729e1ca46b4ec9ca44568e0c03819bd74f4. Both source reviews leave actual browser lifecycle verification pending.

The first new-source normal browser run reported 22 passes and eight WebKit failures. Chromium, laptop and mobile Chrome passed every case. WebKit failures were immediate optional-cookie clearing checks and Back synchronization after the second grant. Test waits are being aligned with asynchronous observer hydration and committed router state, while the implementer checks actual cookie behavior before attributing a source defect. No runtime source fix has been made in response to those failures. Final GREEN remains pending.


## Normal browser GREEN and CI regression coverage

A WebKit probe confirmed the consumer clears malformed state after passive hydration. Observable-state polling corrected the six early assertions. Committed About/BAG content waits removed navigation races before setting another signal. The remaining mobile Chrome timing case passed three focused repetitions. Runtime source stayed at the reviewed snapshot. Final normal browser run 47812 exited 0 with all 30 cases passing in 25.0 seconds.

The implementer had already stopped normal server 15415 and started configured fixture build/server 39192 before the requested parent reuse handoff arrived. Configured action run 83661 is in progress. Parent will rebuild the ordinary profile for its independent shopping-journey regression after runtime ownership returns.

The actual-action regression currently requires an explicit fixture flag, so ordinary CI would skip the same-path behavior. After the real configured result passes, integrate one explicitly allowlisted fixed-code profile into the existing collections suite. Keep ordinary modes' empty-code isolation, use the existing browser-profile marker where practical, and make test selection depend on expected config metadata. The existing CI collections command should exercise the supported Chromium action/no-script cases automatically. No added job, service or dependency is needed. Added harness paths require quality/security re-review and exact profile verification.


## Genuine action and native submission evidence

The configured action profile passed both Chromium cases in 3.8 seconds. The genuine bound server action rejected the wrong fixture code, then set the secure httpOnly unlock cookie and optional signal for the configured public fixture code. The Flight update replaced the form at the same URL in the same document and produced one grant. Native submission with script execution disabled retained its signal until a hydrated reload consumed it once. A first-run history wait was corrected to require committed BAG content after the successful grant assertions.

The approved CI integration uses the existing data-browser-test-profile marker value demo-drop-grant-isolated and matching collections metadata. Normal modes keep their empty code and empty profile flag. The exact Demo45 fixture profile supplies only the fixed synthetic code. The fake-GA manual reproduction will use the same revised profile marker and synthetic code. Final whole-collections execution, harness re-review and parent ordinary shopping-journey regression remain pending.


## Harness review finding

Security re-review cleared the six-file harness delta and tested 24 synthetic flag combinations with process operations stubbed. The fixed code requires all three exact fixture conditions. Ordinary configs clear the profile flag, real integrations are cleared, and external reuse checks the expected profile/scenario. Security fingerprint is b6f0c8fa8f0ac91f312c5602a54ae99657dccb741c827902b0f767ceff2ecd1e.

Primary review confirmed a P2 test compatibility issue. The action tests now run automatically in the supported development collections command but asserted Secure=true. The unchanged server action correctly sets Secure=false outside production. Fix both test expectations against the served render mode, require production when the production flag is set, and verify focused cases in both modes. Application cookie policy needs no change. The implementer owns that fix, validation and re-review handoff before completion.


## Final specialist handoff

The exact existing managed production collections command (session 63996) exited 0 with 61 passing cases and nine explicit skips in 1.4 minutes. Six real action checks ran across Chromium desktop, laptop and mobile Chrome. Four WebKit action cases retain the local production HTTP Secure-cookie boundary and five fake-GA cases require their separately stubbed build.

The P2 test fix is reviewed and resolved. Both quality and security re-review verified Secure expectations derive from the served render mode, reject unknown modes and require production when PLAYWRIGHT_PRODUCTION=1. Reviewed action-spec SHA256 is 79356396abf0a9f5bc21031e4ed4c462328d355df69bd063a91cc4694aa29c9c. Focused cases after this test-only fix passed 2/2 in optimized mode (54277, 24.7 seconds) and 2/2 in development (58899, 40.1 seconds). Runtime source stayed unchanged. Reuse of the earlier complete collection run is limited to its unchanged runtime, fixture, ordering and isolation contracts.

The implementer stopped all owned servers and handed back 13 paths with fingerprint 758b00ed7974c43d3a63a3b4d242a7b776334c2997dc436fa0d2834a59f463cb using sorted path:SHA256 lines joined with LF and a final UTF-8 SHA256. Parent final typecheck 11771, lint 26014 and whole-repository formatting 46673 passed with the full harness. Four agent/document contract tests also passed (84944), covering the related workflow-document update.

Reproduce the CI profile by setting NODE_ENV=production, PLAYWRIGHT_PRODUCTION=1 and PLAYWRIGHT_EXTERNAL_SERVER empty, removing inherited NO_COLOR, then running `python -B -X utf8 .codex/tools/run_project.py test:e2e:collections --reporter=line`. Configuration and launcher supply the allowlisted public fixture code. Add `drop-grant.spec.ts --project=chromium` for focused actual-action cases. Development uses NODE_ENV=development and an empty PLAYWRIGHT_PRODUCTION value with that focused command. Real commerce, email and GA settings are cleared by the managed launcher. The existing CI step runs the full production command without a new job or service.

Parent now owns ordinary optimized Demo build/server 12318 for the final 25 shopping-journey checks. It explicitly clears the collection scenario and grant profile. No item 53 publication has occurred yet.


Parent ordinary optimized build 12318 succeeded with the collection scenario/profile cleared. Its complete shopping-journey run 91819 passed all 25 cases in 29.8 seconds, then the server was stopped. Parent is also verifying the updated documented fake-GA profile against the final root composition, using matching synthetic code/profile, fake ID/assertion and intercepted Google requests. Fake profile server 2560 and five-case run 83396 are active until that check completes.


## Final parent completion checks

The final root composition and revised documented fake-GA profile passed all five analytics cases in 14.6 seconds (83396). Google traffic was locally stubbed or blocked as asserted by the test. Server 2560 was stopped. Final principal browser evidence is 30 cookie-recovery, 61 collection/action, 25 shopping-journey and five fake-GA passes, with nine profile-specific skipped executions in the collection run. The five fake-GA cases skipped there were exercised separately. Focused action checks additionally passed 2/2 in each production and development mode.

Parent independently recomputed the 13-path fingerprint and matched 758b00ed7974c43d3a63a3b4d242a7b776334c2997dc436fa0d2834a59f463cb. Source, harness and review fixes are frozen. Parent integrated units passed 635/62 files, final lint/typecheck/format checks passed, optimized and development builds ran, and four agent/document contract checks passed. All owned servers are stopped. Item 53 is locally complete and ready for branch-only publication. Actual live analytics receipt, HTTPS WebKit action coverage and the recorded abandoned-response timing boundary retain their external or scope-specific verification requirements.


## Publication

The branch was verified exactly surfacebook before commit and again before the explicit push. Published 6d201c3dadad8d8171e35136f2db30dc227be71c with destination HEAD:refs/heads/surfacebook. ls-remote confirmed the same revision. Hosted CI [44179007153](https://github.com/jadnjung/FashionWebsite/actions/runs/44179007153) is in progress at that exact commit. Source, harness, reviews, local verification and documents are committed. Subsequent checkpoint/publication updates may remain uncommitted during the next task.


## Hosted failure follow-up

Hosted run 44179007153 failed its unconfigured browser step after publication. Agent setup passed. Public check output has no summary or test text, and its annotations give only exit code 1 plus an Ubuntu image notice. Saved-credential CI-log reuse remains specifically rejected pending explicit approval. No credential was accessed.

After another actual usage interruption, ordinary capacity recovered with primary 1% and weekly 64%. Parent recovered frozen exact-6d201c3 unconfigured optimized server 31063. Full local reproduction 26386 runs 632 cases with CI retries and two workers. Durable ignored diagnostics are playwright-report/diagnostics/unconfigured-6d201c3.log and .json. The JSON reporter is explicitly selected alongside line output. The build preceded any item 55 application work. The implementer may create independent helper/unit source but must not rebuild .next or use the browser server until reproduction completes.

A separate bounded diagnostics fix will enable Playwright's built-in GitHub reporter only in CI while retaining all existing HTML destinations. This generates future failed-test annotations. It does not retrieve authenticated logs or establish the current failure's cause. Current reproduction explicitly overrides reporters, so the later config-only reporter change does not alter its assertions or reporter selection. [Reporter documentation](https://playwright.dev/docs/test-reporters#github-actions-annotations)
