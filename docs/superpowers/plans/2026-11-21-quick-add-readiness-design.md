# Quick Add readiness design proposal

November 21, 2026. Discovery at published `f5d95e913e1695052a6f33a55f713bd215633235`. No production edits. Parent selected approach B subject to the integration/bundle gates below and owns final plan approval and publication. The separate two-card finding is item 85. Implementation remains gated on the approved implementation plan.

## Distinct outcomes

- **79:** one accepted activation gives accurate opening/code progress, a usable native dialog and bounded local recovery. Retain the separate product-request deadline.
- **80:** before hydration, the control truthfully communicates that it is unavailable; native product browsing remains usable without scripts. After readiness, one keyboard/touch/pointer action works.
- **85, newly measured:** two pending card intents must not produce stacked obsolete dialogs. Prefer native modality over a new shared intent manager when the frame is available immediately.

Preserve D-071's heavy-code splitting, hover/focus preload and persistent dialog lifetime; controlled Escape and close-notification accounting; native focus restoration; fresh selections and per-opening request ownership; and accepted-intent analytics. No new dependencies, eager shopping body, automatic retries/reloads, runtime-internal calls or unrelated refactors.

## Fresh evidence

Pinned runner: `python -B -X utf8 .codex/tools/run_project.py`. Optimized normal Demo launcher `96601`, `exec node scripts/run-browser-server.mjs`, production on, scenario/grant blank, NO_COLOR removed, integrations cleared by the launcher. Fresh escalated preflight found no listener/Next processes. Build compiled in 2.5s, TypeScript passed in 4.9s, server ready on 3000. Chromium used `C:/Users/jaden/AppData/Local/ms-playwright`.

Ignored seven-case Pixel 7 probe `node_modules/.cache/quick-add-readiness-probe.mjs`, session `40801`, exited 0; results in `quick-add-readiness-results.json` beside it.

| Boundary | Observed baseline |
| --- | --- |
| 79, 1.5s panel-code delay | Activation 265.1ms, intent 266.1ms, busy true 270.5ms, false 277.3ms, dialog open 1791.6ms: **1514.3ms false-busy gap**. |
| 79, code held 11s | No dialog, busy false, trigger present, zero Retry buttons. |
| 79, code rejected | No dialog; ChunkLoadError recorded; acquisition rejection lacks local recovery. |
| 80, initial scripts held | Separate single keyboard/touch activations saw enabled=true/busy=false; no intent/dialog after release and five-second observation. No page errors. |
| 80, scripts disabled | Existing product link navigated to the correct PDP. |

These artificial holds establish behavior, not ordinary-network frequency, and are separate from repaired close ownership.

Two-card probe `quick-add-multiple-intents-probe.mjs` exited 0 (output `a24b40`): while code was held on /new, one tap each on pieces 24/23 emitted two intents at 313.4/374.9ms. On release, **both dialogs were open and :modal**, with focus in piece 23. Root owns item 85's backlog record.

Ignored platform spike `quick-add-shell-readiness-spike.mjs` exited 0 (output `d8480d`): a test-injected lightweight native shell was open while the real baseline heavy chunk remained held; a second normal tap timed out because the dialog intercepted pointer events. Exactly one spike action/one dialog, codeLoaded=false; Close restored the first trigger's focus. This proves native-shell feasibility, **not** the proposed React split, analytics integration or its bundle cost. Their tests remain required.

## Two approaches and decision

**A — Keep the entire native panel lazy.** Explicitly acquire it through one import loader, own each bounded opening until a showModal acknowledgement, and show progress/Retry/Cancel/View Product beside the trigger. The measured two-card behavior requires a small shared opening lease plus a stale-owner guard immediately before showModal. This retains the existing split but adds cross-card coordination while visitors wait.

**B — Urgent native frame, lazy shopping body (recommended; parent preference).** Keep the verified native frame/cancel/counter in QuickAddPanel, extract only shopping-body responsibilities, and show the frame urgently from one ready activation. The frame immediately supplies progress, Close, focus containment and background inertness. Load the heavy body on demand. It avoids a shared intent manager; its cost is a small eager frame and a controlled extraction. Preserve the current desktop dialog/mobile sheet treatment. Do not put the frame behind a transition, Suspense fallback or another chunk.

The platform spike supports B. Actual second-activation blocking and exact eager bytes must be measured on the approved implementation; do not claim they are already established by production code. If its urgent native frame still permits two normal accepted activations, investigate that boundary before adding coordination.

## Exact proposed files and contracts

- `components/catalog/QuickAddTrigger.tsx`: statically import the now-lightweight frame and its preload function, retain hasEverOpened/persistent mounting, and set open urgently without useTransition. Keep explicit trigger focus, accepted-intent event, input reveal/touch targets and a synchronous duplicate-input guard. Existing handle/title props and ProductCard caller stay unchanged.
- `components/product/QuickAddPanel.tsx`: retain its existing props `{ handle, title, open, onClose }`, native dialog markup/header/Close, controlled cancel, close effect and notification counter. Remove shopping imports/state into the body. Own local code-load state, attempt timer/controller, progress and recovery. Export `preloadQuickAddBody(): void`, using the same literal import/cache as actual acquisition. No runtime shopping import outside that loader.
- `components/product/QuickAddBody.tsx` (new): `QuickAddBody({ handle, open }: { handle: string; open: boolean })`. Move existing product fetch/deadline, selections/retry, availability, price, analytics, cart feedback and purchase controls here, preserving their logic. Once loaded and mounted, keep the body mounted and pass open=false on closure so existing request cleanup and fresh reopening run normally.
- `tests/e2e-demo/quick-add-readiness.spec.ts` (new): separate 79/80/85 tests. Existing request-deadlines, navigation, variants and shopping cases stay regression coverage. Add focused unit tests only for independently testable loader/attempt behavior if extraction warrants them. Parent owns CONTENT/architecture/decision/backlog updates.

The frame's loader returns `Promise<typeof import('./QuickAddBody')['QuickAddBody']>`; type-only component references do not pull shopping code into its runtime bundle. Cache resolved/in-flight code, clear rejected acquisition, and handle preload rejection without an unhandled promise or open intent. Preload never mounts a body or fetches product data.

Installed Next 16.3.1 wraps ssr:false dynamic components in its own Suspense, whose loading callback gets error:null; React.lazy caches rejected loads. Therefore prefer explicit Promise acquisition/catching for the body rather than assuming that resetting a lazy/error-boundary key retries it. The emitted Turbopack transport retries once and removes terminal failed script/cache entries; module evaluation errors remain cached. Reject/restore/Retry must actually pass in the optimized build. Persistent failure must retain product navigation; use no private runtime APIs or cache-busting URLs.

## State, readiness, copy and focus

**80:** use the existing ClosetLoader-style useSyncExternalStore snapshot: false on server/first hydration render, true on client, stable empty subscription. Render the same natively disabled QUICK ADD button before readiness, with existing disabled styling and an associated screen-reader description: `Quick Add is loading. View this piece to choose options.` Enable only after handlers are attached. Preserve the button/row rather than replacing a focused native link. Existing image/name product links remain usable, including with scripting disabled. No accepted intent while unavailable; no disappearing helper row or new layout shift.

**79:** the ready trigger opens the frame urgently. Use aria-haspopup/aria-expanded for the trigger; remove the inaccurate transition-based aria-busy claim. Put real code-loading aria-busy on the frame's shopping region, keeping Close and the live status outside that busy subtree. The modal and Close are immediately usable; code progress lasts until the body actually mounts. This is separate from the body's existing product-data skeleton and API deadline.

Frame code phases: idle → loading → ready, or loading → error. Start a **10,000ms code-attempt budget when the open frame starts acquisition or the visitor chooses Retry**; hover/focus warmup does not spend that user-attempt budget. The existing product request gets its own 10,000ms budget after body mount. Use existing AbortController/ref/identity patterns from client-request/CartProvider, not the JSON helper itself for a non-fetch operation.

Close/controlled cancel, timeout, a newer attempt, prop closure or unmount invalidate old ownership before subsequent state can commit. Dynamic import itself cannot be aborted; late success may warm the module cache but cannot mount a closed/unmounted body's work or reopen/focus its frame. Retry after a stall may reuse a pending import under a fresh bounded UI attempt. A successfully loaded body survives native closure to preserve existing data cleanup and fresh selections.

Copy: keep `QUICK ADD` and `CLOSE`; code progress `Loading Quick Add…`; code failure `Quick Add could not load.`; recovery `Retry` and a real `VIEW PRODUCT` anchor to the known handle. Existing Close cancels a pending opening; no extra Cancel action is needed. These utility messages follow CONTENT's concise explanation/recovery rules; confirm them before implementation. No customer-facing chunk/hydration jargon or new animation.

One accepted ready activation emits quick_add_open once even when code later fails. Retry recovers that intent without another event; a fresh activation after closing is a new intent. Same-card duplicate activation during an active opening emits nothing extra. Native modality should reject a second ordinary card activation during body loading, rather than accept an obsolete intent.

Keep native return focus targeted at the original trigger (including Safari). Code timeout/error announces politely inside the modal and does not steal deliberate focus; Retry stays useful while Close is always available. Keep the frame mounted across all closures and code retries. Screen-reader DOM/live-region checks do not prove actual assistive-technology speech.

## Bundle gate and acceptance tests

Fresh catalog initial scripts/pre-activation network exclude both panel-containing baseline chunks: `0dw8lqmfts3xe.js` **11,483 raw/4,164 gzip bytes**, `1kis5oinwxfon.js` **11,517/4,182**. Both were requested on focus-plus-activation in this build, along with two other lazy JS files. These are grouped chunk measurements, not the feature's isolated marginal cost. Do not reuse D-071's historical sizes or single-copy observation.

On the approved split, compare exact initial script sets/raw+gzip totals for /about, a catalog and a PDP. Identify QuickAddBody-specific purchase code and its dynamic entry; neither may enter initial JS or fetch before hover/focus/activation. Shared VariantPicker/cart/request helpers may already be initial dependencies of other features, especially on a PDP; do not misclassify those existing bytes as a split failure or feature saving. Inspect the complete module grouping and report the eager frame's actual delta; cached reopen must not reload code. One loader may remove duplicate paths, but claim no savings before measurement.

- **79 progress/recovery:** cold keyboard/touch/pointer opening with body code held; modal/Close available promptly, truthful code busy/status until body mount; cached opening works once. Stall beyond 10,000ms and reject every framework transport attempt: local recovery, no page-level error, Retry/Close/native product navigation usable. Restore and Retry once, with one original intent and one current body/data request.
- **79 lifetime:** close/timeout/unmount/navigation during load, then release old code: no late modal/body work/focus. Retry overlap cannot overwrite newer status. Closing while a loaded body's request is pending preserves existing cancellation/late-decoder semantics.
- **80:** held initial scripts show a disabled described control and usable product destination; no accepted intent. After hydration one activation works, without hydration errors/focus loss. No-script product browsing works and Quick Add remains honestly unavailable.
- **85:** while the first body's code is held, attempt a second normal card activation: it is actually blocked by the modal, no second accepted intent/dialog; Close restores focus and permits a later genuine second opening. Do not replace this with forced activation.
- **Regressions/validation:** original and controlled Escape cases, both programmatic notification timings, consecutive reopen/focus, nested Search Tab/Escape, deadlines/late body, variant availability and shopping telemetry across the existing five profiles; reduced motion and responsive/touch targets; compiler/lint/format/build and bundle gate. TDD and parent primary/security reviews precede surfacebook publication.

## Handoff

No production/dependency/backend/API change or commit/push occurred in this assignment. TypeScript references confirm ProductCard remains the trigger's sole component caller. Root approves the [implementation plan](2026-11-21-quick-add-readiness-implementation.md) before production edits. Original probe session `96601` was still addressable by its owning worker and was stopped with Ctrl-C on root's explicit request (intentional launcher exit 1). Fresh escalated verification `d4c3e1` exited 0 with no port-3000 listener or matching Next launcher/server/build processes. Runtime is released to root for the separate fixture repair; perform fresh coordination before any later readiness execution. Ignored probes/results are reproducible local evidence, not publication artifacts.
