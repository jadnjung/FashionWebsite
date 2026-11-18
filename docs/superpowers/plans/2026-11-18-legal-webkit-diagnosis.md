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

Matching CI44264476075 failed the known legal sweep on tablet/mobile Safari. Public context links RSC cancellation events to hard navigation: current/privacy to intended/terms at339ms and current/shipping to intended/returns pageerror at490ms in separate attempts. Destination responses were200. Query-free network/route context is visible publicly, proving reporting works. Exact causal classification/remedy remains open; no error exclusion or application fix is inferred. The preceding389d53b full run44261401908 succeeded, so the symptom is not deterministic across matching builds. New recovered grant-receipt and SizeGuide-scroll symptoms are recorded as81/82; QuickAdd reopen repeats76.
