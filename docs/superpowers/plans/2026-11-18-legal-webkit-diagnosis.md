# Item 75: WebKit legal-page diagnosis

## Scope and checkpoint

Base revision: `389d53b1f4909f5dd572d0549ec9d91f8a200773`, branch `surfacebook`.
QA owns `tests/e2e/legal.spec.ts` only if a demonstrated cause supports a fix,
this execution record, and ignored diagnostics. Parent owns integration,
independent/security review, other documentation and publication. Existing edits,
`debug.log` and Claude files are preserved. No tracked implementation/configuration
change has been made at this checkpoint.

Confirmed hosted RED, supplied by parent: run 44224527084 at 90a4491 fails the
unchanged seven-page legal sweep on tablet at its page-error assertion through
both retries. Mobile Safari recovers the same same-origin RSC access-control
symptom. This does not establish the cause of older hosted failures.

## Local environment and prerequisites actually executed

- Windows PowerShell, Python 3.12; isolated project Node 22.23.5/pnpm 11.22.0
  verified by `python -B -X utf8 .codex/tools/run_project.py --check`.
- Port 3000 had no listener before the build. Approved process inventory found
  no remaining project Next/launcher/PostCSS/pinned-runtime Node process.
- Launcher: `python -B -X utf8 .codex/tools/run_project.py exec node scripts/run-browser-server.mjs`.
  Per invocation `NO_COLOR` removed, `NODE_ENV=production`,
  `PLAYWRIGHT_PRODUCTION=1`, `PREVIEW_DEMO_MODE=''`,
  `PREVIEW_COLLECTION_SCENARIO=''`, `BROWSER_TEST_DROP_GRANT_PROFILE=''`.
  Launcher pins Shopify/email/real analytics/support configuration empty and
  `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- First default and approved outside-sandbox builds failed before tests with a
  Turbopack PostCSS worker exiting before connection, status 0, no worker output.
  A direct pinned-Node child-process smoke check succeeded; `NO_COLOR` absent.
  Preserved generated `.next` cache under ignored
  `node_modules/.cache/legal-webkit-build-cache`. The initial preservation under
  `test-results/diagnostics` unintentionally entered TypeScript's broad source
  glob; moved it to excluded `node_modules/.cache` before continuing. No compiler
  or application config changed. Clean compilation succeeded.
- Optimized unconfigured build and build-time TypeScript passed in session
  `55053`; server ready at `http://localhost:3000`. QA currently owns this runtime.
  Expected missing-Shopify build warnings were observed.
- Browser binaries: `PLAYWRIGHT_BROWSERS_PATH=C:/Users/jaden/AppData/Local/ms-playwright`.

## Reproduction in progress

Unchanged spec SHA256:
`c7f1c7f1e465c551e38b9ef2e2839f3135c97441c00cefc60eaebb4957768a71`.

Session `66306` runs the exact unchanged test, ten repetitions each for
`tablet` (iPad Mini WebKit, 768x1024, touch) and `mobile-safari` (iPhone 13 WebKit,
390x664, touch), two workers, no retries:

```text
python -B -X utf8 .codex/tools/run_project.py test:e2e tests/e2e/legal.spec.ts --grep 'all seven pages' --project=tablet --project=mobile-safari --repeat-each=10 --workers=2 --reporter=line
```

Runner uses `PLAYWRIGHT_PRODUCTION=1`, `PLAYWRIGHT_EXTERNAL_SERVER=1` and the
binary path above. Global setup verifies the isolated unconfigured/production
server marker. Log: ignored `playwright/.cache/legal-webkit/unchanged-sweep.log`.
Completed result: **20/20 passed**, exit 0, 20.9 seconds. No local RED was
reproduced; this does not close the confirmed hosted failure. No extra unchanged
repetitions were added.

Session `7070` compared detailed active-URL/time/request-failure/status/redirect/stack
diagnostics for the original sweep, individually settled legal pages and actual
footer clicks. Preserve console/page-error assertions. No fixed sleeps,
permissive CORS, prefetch disabling or global error filtering.

Comparator source: ignored `playwright/.cache/legal-webkit/compare.mjs`.
It uses the same shipped device profiles, checks unconfigured/production markers,
captures document and RSC request starts/finishes/failures/responses, records
active page URL/phase, redirects, HTTP status, console location and error stacks.
For isolated pages and footer journeys it asserts destination heading/title and
scrolls to the real legal navigation. Each isolated destination gets its own
fresh context. Both original and footer journeys keep one context per sweep.
All modes retain an empty console/page-error assertion; instrumentation may itself
alter timing, so its original-mode results supplement the unchanged CLI run.

## Comparison results and current conclusion

- First content-ready comparison `7070`: 18/18 scenarios passed, exit 0. Some
  isolated contexts still had background RSC requests when content assertions
  completed. Preserved as ignored `content-ready-events.json`; this first pass
  does not establish settled-request behavior.
- Refined settled comparison `56021`: 18/18 scenarios passed, exit 0: two
  instrumented original sweeps, fourteen fresh isolated-page contexts, and two
  actual seven-link footer sweeps. 42 destination visits total. Isolated and
  footer cases additionally await terminal response/finished events for observed
  document/RSC requests, with a 15-second maximum and no fixed sleep. That wait
  exists only in the ignored diagnostic script, not the unchanged legal test.
- Captured WebKit reports version `26.5`, platform `win32`. The final run began
  `2026-11-18T07:54:12Z`. All 338 observed document/RSC requests completed with
  HTTP 200; zero redirects, request failures, console errors or page errors.
  Isolated/footer boundaries had zero pending observed requests. All request
  origins were `http://localhost:3000`.
- Final data: ignored `playwright/.cache/legal-webkit/comparison-events.json`,
  `comparison-summary.log`, and `compare.mjs`. The initial content-ready data
  and unchanged-sweep log are retained separately in the same directory.

Expected: each destination renders and legal navigation produces no console or
uncaught page errors. Actual local behavior met those expectations. The hosted
RED was **not reproduced locally**. No root cause, test fix, application fix,
hosted pass or item closure follows from this evidence. In particular, a canceled
prefetch is still a hypothesis; no canceled request occurred in the final local
capture.

Parent authorized the next step: failure-only diagnostic enrichment in the
existing cross-cutting legal test, recording destination/active URL, error stacks
and bounded document/RSC network events. Preserve all seven `page.goto` calls,
both original empty-array assertions and error collection. No navigation waits,
error exclusions or application changes are justified yet.

## Diagnostic-only implementation and verification

Only tracked test change: `tests/e2e/legal.spec.ts:84`.
The original seven document navigations and both empty-array assertions remain.
Added an in-memory ring of the last 30 events: goto, console/page error,
document/RSC response status and request failure. Every record has elapsed time,
intended destination and active pathname. The first error and first page-error
stack are retained separately, so later request noise cannot erase them.
Messages are limited to 300 characters, stacks to 2,000. Added URL fields expose
pathnames and an RSC boolean; query/fragment tokens are stripped from diagnostic
text, including WebKit messages lacking an `http` scheme. No headers, environment
values or request bodies are captured. Original error arrays remain unchanged.

Failed assertions include concise public context: destination, active pathname,
first error without stack, and the last three response/request-failure records.
Only a failure attaches `legal-page-diagnostics` JSON. There are no added waits,
prefetch changes, filters, retries or permissive CORS settings.

Executed checks:

- Original synthetic page-error probe on an ignored copy of the unchanged spec:
  both WebKit profiles fail at the page-error guard as expected, exit 1, without
  the new diagnostic attachment. The browser injects an uncaught error using
  `page.addInitScript`/`queueMicrotask`; application code remains untouched.
- Enriched probe: both profiles still fail as expected and attach timing,
  first error `/legal/privacy`, final active/destination `/contact`, stack and
  HTTP 200 response metadata. Added public context is visible in reporter errors.
- Normal full legal suite, session `94461`:
  `python -B -X utf8 .codex/tools/run_project.py test:e2e tests/e2e/legal.spec.ts --workers=2 --reporter=line`.
  **40/40 passed**, exit 0, 16.1 seconds. Chromium 1280x720, mobile Safari
  390x664, tablet WebKit 768x1024, laptop Chromium 1024x768. This run precedes
  the final two-line query/fragment sanitizer refinement below; application,
  server, navigation and assertion behavior were unchanged by that refinement.
- Parent primary review identified a scheme-less-query omission. Reproduced
  with `/localhost:3000/tops?_rsc=synthetic-query-marker#synthetic-fragment-marker`
  in an injected page error: both profiles fail as expected but the initial
  diagnostic text leaks those synthetic markers. Added query/fragment-token
  stripping and reran the same probe. Both still fail as expected, exit 1;
  **both new public context and JSON attachment omit both markers**, while the
  original raw assertion diff retains the marker. Each attachment has 21 events
  (within the 30-event cap), a page-error stack, path/timing and network status.
  This controlled RED/GREEN proves the diagnostic privacy correction and
  failure preservation, not a fix for the unreproduced hosted failure.
- Probe evidence: ignored `playwright/.cache/legal-webkit/probe-before.json`,
  `probe-after.json`, `probe-after-final.json`, `probe-schemeless-before.json`,
  `probe-schemeless-after.json` and compact `probe-verification.json`.
  Probe source/config are preserved with `.txt` suffixes, outside the compiler's
  TypeScript file glob. They are ignored and will not be committed.
- TypeScript LSP snapshot reported no diagnostics (`complete=false`); this is
  not a compiler pass. Prettier passed on the test and this plan; `git diff
  --check` passed. Parent owns final integrated compiler/lint/format checks;
  QA did not duplicate those checks after that handoff.
- Final test SHA256:
  `77388f9bac8d8130f104b172a0101c1b36f7d525a98539427aa18bcf11769ea6`.
  Parent/security specialist report a clear static security re-review of this
  exact hash. Parent retains primary review and publication responsibility.

Runtime `55053` was stopped with Ctrl+C after the probes. No port-3000 listener
remained. No commit or push was performed by QA. Item 75 stays open pending an
evidenced diagnosis and matching hosted validation; this is diagnostic enrichment.

## External context and limits

Parent read primary upstream discussions
[Playwright 43120](https://github.com/microsoft/playwright/issues/43120) and
[42823](https://github.com/microsoft/playwright/issues/42823), describing WebKit
canceled-load access-control reporting and Next hard-navigation/prefetch timing.
These suggest a hypothesis; they are not proof of this application's cause.
No dependency upgrade or application workaround follows from this context alone.

Matching hosted CI 44260605709 and 44261401908 were in progress at assignment.
No hosted success, item closure, local fix or passing review is claimed.
Populated Demo, purchase flows, physical devices and assistive-technology speech
are outside this focused unchanged legal-page reproduction; no external-account
access, customer email, purchase or live-data mutation is performed.


## Publication

Parent final compiler, targeted lint/formatter, document links/numbering and diff whitespace passed. Mandatory security re-review cleared final SHA-256 above, including final synthetic privacy evidence. Verified surfacebook before commit and again before explicit push. Published b057d5b98473f3941c8293ac079ed12d6b567e23; fresh remote revision matches. Matching hosted verification is pending. Item 75 remains open; this commit improves reporting and does not establish the earlier hosted cause.


## Enriched hosted recurrence

Matching CI 44264476075 failed the known legal sweep on tablet/mobile Safari. Public context links RSC cancellation events to hard navigation: current/privacy to intended/terms at 339 ms and current/shipping to intended/returns pageerror at 490 ms in separate attempts. Destination responses were 200. Query-free network/route context is visible publicly, proving reporting works. Exact causal classification/remedy remains open; no error exclusion or application fix is inferred. The preceding 389d53b full run 44261401908 succeeded, so the symptom is not deterministic across matching builds. New recovered grant-receipt and SizeGuide-scroll symptoms are recorded as 81/82; QuickAdd reopen repeats item 76.

## Accepted lifecycle-coverage repair checkpoint

Parent authorized implementation from published
`8cbfb99120e8f2dc7641d29399e0ff3d27e02e99` on `surfacebook`.
QA owns only `tests/e2e/legal.spec.ts`, this execution record and ignored probes.
Other edits, `debug.log` and Claude files must remain intact. No commit/push by QA.
Runtime was handed off free; verify port 3000 before starting a pinned optimized
unconfigured server. Weekly capacity was 99%, primary 27%, ordinary allowed at
assignment; checkpoint before edits and after small milestones. An actual usage
stop leaves work pending, not complete.

Accepted shape: retain content/sitemap coverage; replace the aggregate with seven
fresh normal-page-fixture arrival tests checking HTTP 200, exact URL, visible
heading/title and strictly empty console/page-error arrays. Add a real footer-link
chain with one keyboard activation, guarding the entire journey. Reuse the bounded
sanitized collector in a file-local helper. No error exclusions, application,
prefetch/CORS changes, sleeps, dependencies, routes or config changes.

Required proof: ignored synthetic page-error probes fail isolated arrival and
footer journey; synthetic console error also fails; added diagnostic surfaces
strip query/fragment markers. Run all four legal profiles plus compiler, targeted
lint/format. Parent owns independent/security review, integrated checks and
publication. The old aggregate at `b057d5b` remains hosted RED evidence. Matching
hosted validation is required to close 75; this repair does not classify every
WebKit access-control error as benign. Latest Quick Add CI44309969021 is in
progress; no overall hosted pass is claimed.

Implementation checkpoint: extracted the existing bounded/sanitized collector
into `expectLegalJourneyWithoutErrors` within `legal.spec.ts`. Added the seven
isolated arrival tests and one footer chain, using keyboard focus/Enter for the
first link and pointer clicks thereafter. Existing content/sitemap tests remain.
Formatting completed; no runtime/browser pass is claimed yet. The source does
not filter any errors or wait for teardown/background traffic.

Runtime checkpoint: optimized unconfigured build and build-time TypeScript passed;
server session `17552` ready at localhost:3000. Same pinned environment and
launcher as earlier, with NO_COLOR removed and no-store integrations forced empty.
Targeted ESLint passed (session `6984`, exit 0), targeted Prettier passed.
Full four-profile legal run `9042` is executing 68 cases with two workers and
external-server mode verification. Log:
`playwright/.cache/legal-lifecycle/legal-suite.log` (ignored).
Source SHA256 at this checkpoint:
`d9d4d9c200e23ac476094f893f3330d28c172732501f9c8b753bd8b2853bf9f6`.
Ignored negative-probe copy/config prepared under
`playwright/.cache/legal-lifecycle/`; rename `.ts` probe/config to `.txt` after
running so broad compiler glob is not contaminated. Planned probe commands use
`LEGAL_PROBE_ERROR_KIND=page` then `console`, select Privacy arrival and footer
chain, and run both WebKit profiles. No negative-probe result claimed yet.

## November 21 recovery checkpoint

QA resumed the unfinished lifecycle proof on `surfacebook`. The owned source
still has SHA256 `d9d4d9c200e23ac476094f893f3330d28c172732501f9c8b753bd8b2853bf9f6`.
Port 3000 has no listening socket. The older log says 68 passed, but its original
session exit and current environment are not verified; it is historical evidence
only. Inspect the retained ignored probe/config and project processes, start or
verify the isolated production runtime, execute negative guards/privacy proof,
then run a fresh four-profile legal suite. Parent retains integrated validation,
independent/security review and publication; no hosted success is inferred.

Fresh environment milestone: pinned runtime check reports Node 22.23.5,
pnpm 11.22.0 and installed dependencies. Escalated project-process inventory and
port inspection found no stale runtime. Session `9853` rebuilt using the normal
isolated launcher with the pinned environment above; optimized compilation,
build-time TypeScript and static generation succeeded, followed by Next ready on
localhost:3000. Only expected unconfigured-Shopify warnings appeared. The retained
negative-probe source starts with the exact current tracked source and appends an
init-script synthetic-error hook; no tracked application/test edit was needed.

Prerequisite failure, not negative-guard proof: the first recovered page-error
probe command exited 1 with four browser-launch failures because
`C:/Users/jaden/AppData/Local/ms-playwright` is absent (expected WebKit 2336).
No browser test body executed. Preserve `probe-page-recovery.log/json` as the
launch-failure record; restore project-matched browser binaries before rerunning.

Negative-proof milestone: `playwright install chromium webkit` completed with
exit 0 in the existing requested AppData cache, installing Chromium/headless 1234
(151.0.7922.34), WebKit 2336 (26.5), FFmpeg 1011 and Winldd 1007. No dependency
or tracked configuration changed. With `PLAYWRIGHT_PRODUCTION=1`,
`PLAYWRIGHT_EXTERNAL_SERVER=1`, `NODE_ENV=production`, `NO_COLOR` removed and
the pinned browser path, ran the ignored exact-source copy/config twice:

```text
python -B -X utf8 .codex/tools/run_project.py exec playwright test -c playwright/.cache/legal-lifecycle/probe.config.ts --grep 'Privacy Policy arrives|footer links visit' --workers=2 --reporter=line,json
```

`LEGAL_PROBE_ERROR_KIND=page`: four expected failures, exit 1, 6.5 seconds.
`LEGAL_PROBE_ERROR_KIND=console`: four expected failures, exit 1, 6.4 seconds.
Each covers Privacy arrival and all seven real footer activations on mobile
Safari 390x664 and tablet WebKit 768x1024. All failures occur at the respective
strict empty-array guard (page-error line 169, console-error line 168), after the
journey reaches its expected final destination. Eight diagnostic attachments
retain bounded event counts, error context and page-error stacks where applicable.
Automated inspection of all eight report results verifies both synthetic query
and fragment markers absent from the added public context and JSON attachment,
while both remain present in the original raw assertion message. This proves
failure preservation and diagnostic sanitization, not hosted failure resolution.

Ignored evidence: `probe-page-executed.log/json`,
`probe-console-executed.log/json`, `probe-recovery-verification.json` and the
verification script under `playwright/.cache/legal-lifecycle/`. The initial
launch-failure files remain separate. Both probe source and configuration now
have `.ts.txt` suffixes; they no longer enter the compiler's broad source glob.
Tracked test SHA256 remains `d9d4d9c200e23ac476094f893f3330d28c172732501f9c8b753bd8b2853bf9f6`.

Fresh positive-proof milestone: all **68 legal cases passed**, actual exit 0,
24.1 seconds, runner session `62084`. Command:

```text
python -B -X utf8 .codex/tools/run_project.py test:e2e tests/e2e/legal.spec.ts --workers=2 --reporter=line
```

Same production/external-server environment and pinned browser path as the
negative probes; global setup verified unconfigured isolation and production
rendering. Profiles: Chromium 1280x720, mobile Safari 390x664, tablet WebKit
768x1024 and laptop Chromium 1024x768. Content, draft notices, metadata, exact
arrivals, HTTP status, one keyboard footer activation plus six pointer clicks,
strict page/console guards and sitemap checks passed. Full output is retained as
ignored `playwright/.cache/legal-lifecycle/legal-suite-recovery.log`.
Targeted ESLint and Prettier completed without findings; diff whitespace passed.
The tracked test source remains unchanged from the accepted lifecycle checkpoint.

Final targeted recheck: sandbox pnpm project-store symlink registration failed
before Prettier execution. Escalated retry reported the existing lockfile and
dependencies already up to date, then explicit `LINT_EXIT=0` and `FORMAT_EXIT=0`
in session `46747`. No tracked dependency/configuration changes resulted.

At handoff, session `9853` remains healthy for the parent's integrated run.
Escalated socket verification confirms port 3000 listening on `::`, PID 2880.
Runtime ownership is now the parent's; QA will start no further browser/build
work. Parent retains integrated compiler/lint/format, independent/security
review and server shutdown. No commit/push by QA. Populated Demo shopping,
physical devices, assistive-technology speech and separate reduced-motion cases
are outside this test-only legal-lifecycle scope. Matching hosted validation is
still required before item 75 can close; local success does not establish the
earlier hosted root cause.


## November 21 parent integration acceptance

Parent read the eight-result negative-probe verification receipt and reviewed the actual one-file diff. Fresh native security review cleared SHA-256 d9d4d9c200e23ac476094f893f3330d28c172732501f9c8b753bd8b2853bf9f6 with no actionable findings. The stricter arrival and guarded footer scopes retain uncaught/console assertions and diagnostics; no application or test-profile configuration changed.

Parent full unconfigured run 49121 passed 645 tests with 15 intended skips across 660 cases in 4.6 minutes, exit 0. JSON receipt confirms unexpected=0 and flaky=0. Command used the pinned runtime with CI=1, optimized external unconfigured server, workers=2 and line/JSON reporters. Ignored receipts: playwright-report/diagnostics/legal-lifecycle-integrated.log and .json. Final parent typecheck, full lint/format run 96880 and diff checks passed. Probe TypeScript copies were renamed before compiler validation. Source bytes match the reviewed hash.

After explicit handoff, QA stopped the original server session 9853 on root instruction; fresh escalated verification found zero port-3000 listeners and zero project Next/launcher processes. Runtime is released. D-106, roadmap, backlog and the compact maintenance checkpoint describe this repair. Governance/planning prose is excluded by formatter policy; its links/numbering are checked separately. Branch-only publication and matching hosted verification follow. Keep item 75 open until its matching hosted evidence arrives.


## Lifecycle repair publication, November 21

Verified surfacebook before commit and again before explicit push. Published 07582d66139976905e9e961a2a45dfeabbf042af; fresh remote revision matches. Final structural checks passed the reviewed source hash, 228 local links and all 82 backlog entries. Matching CI 44966663898 is in progress. Local repair is complete; item 75 remains open pending that hosted verification. Root proceeds to the separate native Escape/reopen gap in item 76.
