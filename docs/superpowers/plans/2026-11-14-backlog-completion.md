# Website backlog completion implementation plan

Use the feature-dev and subagent-driven-development workflows for implementation and review.

The goal is to implement and verify the locally achievable work in all 46 backlog items, then repeat complete shopping journeys and record remaining evidence gaps.

The specification is [the improvement backlog](../../website-improvement-backlog.md). Existing Next.js, React, Shopify adapter, Demo fixtures, native dialogs, and browser tests remain the implementation foundation. Shopify owns live commerce. Local demonstration outcomes use synthetic data.

## Work packages

- [x] Reliability specialist owns Recently Viewed storage, bag cancellation/locking, wishlist refresh/missing states, and related tests. Items 01, 13, 26–28.
- [x] Product specialist owns pickers, product buying controls, sizing, outfit eligibility, gallery recovery, variant links/media behavior, and related tests. Items 02, 05–07, 11, 30, 40.
- [x] Catalog specialist owns filters, continuation, variant completeness, fixture expansion, client transport tests, imagery contracts, and related tests. Items 08–10, 21, 23, 31, 42.
- [x] Navigation specialist owns search, closet motion/focus, contrast/wrapping across navigation, and related tests. Items 03–04, 12, 32, 43–46.
- [x] Coordinator integrates shared source contracts, PDP recommendation isolation, visible breadcrumbs, metadata/sitemap, access and contact copy, deterministic test modes, optimized-build smoke, analytics/performance checks, rendering/CSP investigations. Items 14–22, 24–25, 29, 33–39, 41.
- [x] Independent quality/security review, fixes, integrated format/lint/type/unit/build/browser validation.
- [x] Repeat the complete shopping journey across device profiles, keyboard, reduced motion and failure modes. Record assistive-technology evidence still pending. Record observed evidence and newly found gaps in the backlog.
- [x] Update each backlog item with actual completion status, evidence, or the precise remaining external/device dependency. Validate and publish only to surfacebook.

## Ownership and integration

Workers share this checkout and preserve each other’s changes. The coordinator owns documentation, global CSS, test configs, workflow/package scripts, SEO files, access/contact/legal routes, and the PDP route. Workers own only their assigned application areas and associated tests. Catalog owns Shopify types/queries/fixtures and must coordinate optional variant media additions with the product specialist. ProductCard belongs to catalog. Global CSS edits go through the coordinator. Workers never commit or push.

Use focused regression tests for actual defects and meaningful new contracts. Run compiler checks after shared type integration and full validation after all packages settle. No final success claim substitutes for observed results. Human usability testing, physical devices, final product facts, live accounts, and hosted verification require their actual evidence and stay explicitly tracked when unavailable.

## Execution record

Started from revision 09a0aa9 on surfacebook with a clean working tree. Standing user authorization covers commands, edits, validated commits, and explicit pushes to surfacebook.


### Integrated verification as of November 15

- Fresh full unit run passed 54 files and 542 tests. Lint and TypeScript checks passed. Formatting identified the measurement script, which was formatted before the final formatting rerun.
- The latest isolated Demo production build compiled, typechecked and generated 24 routes successfully. The owned server pins external integrations and identifies its Demo isolation profile.
- Final non-3D Demo production browser verification passed 512 tests with 18 skips in 10.9 minutes across Chromium, laptop, mobile Chrome, tablet WebKit and mobile Safari. Command used `test:e2e:demo --grep-invert "Collection Closet" --reporter=line` with verified external production isolation. The final separate software-WebGL run passed all 24 cases in 5.6 minutes across Chromium, laptop and mobile Chrome. Combined Demo totals are 536 passed and 18 skipped. The skips cover desktop-only hover, custom cursor and modifier-key interactions on touch profiles. Earlier failed and interrupted runs are diagnostic evidence and do not establish a full-suite pass.
- Focused Chromium production checks passed all 14 catalog-completion, shopping-journey and countdown cases after integration. The final full run supersedes overlapping focused counts.
- Independent native security review and focused re-reviews found no remaining confirmed issues after request-bounding, collection-membership continuation and transport fixes. The final re-review checked server clock authority and the opt-in CSP origin allowlist.
- Independent architecture review confirmed the bounded catalog scans, independent facet discovery and collection-membership continuation resolve its findings.
- Independent expert browser walkthrough covered 320, 390, 768, 1024 and 1440px layouts, option targets, sizing units, gallery crop continuity, Search/Quick Add, access recovery, bag persistence, keyboard focus and scripts-disabled primary product content. The mobile filter position issue found during that walkthrough was fixed with a native collapsed disclosure and covered by browser assertions.
- Software-GPU functional checks use their own fixture budget and run separately from normal shopping checks. Driver-observed timing belongs to the separate measurement command.

### Remaining evidence

Demo browser totals, cold mobile measurements and observed CSP compatibility are recorded below. The full unconfigured production suite passed 605 tests with 15 skips. Real shopper research, screen-reader speech, actual browser magnification and physical-device testing remain pending. Automated emulation and expert checks are recorded with their actual scope. Final product measurements, photography, policies, live commerce, hosted analytics and email delivery require owner or service evidence.


### Observed local CSP and narrow-screen checks

Chromium observed the report-only header and zero `securitypolicyviolation` events on `/new?sort=featured`, the crewneck product, `/bag` and `/`, with WebGL disabled and reduced motion enabled. This covers those local page loads. Third-party hosted analytics, live checkout and actual GLB assets still require compatibility checks before enforcement.

At both 320 and 390px viewport widths, the first catalog product began at y=381.5px. Document scroll widths matched viewport widths. These direct checks confirm the compact disclosure fix under the tested conditions.


### Cold mobile production measurements

Command `measure:storefront` completed three fresh Chromium 151.0.7922.34 contexts at 390×844, 4× CPU slowdown, 150ms latency, 200,000 download bytes/second, disabled cache and disabled WebGL. Each context loaded the crewneck product and exercised Search, variant selection, gallery opening and bag addition.

| Sample | LCP ms | CLS | Initial script transfer bytes | Search ms | Variant ms | Gallery ms | Bag ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1768 | 0.00022037 | 182998 | 815 | 930 | 370 | 722 |
| 2 | 1716 | 0.00022037 | 182998 | 1471 | 527 | 438 | 574 |
| 3 | 1812 | 0.00022037 | 182998 | 1243 | 488 | 429 | 512 |

Activated script transfer totals remained 182998 bytes in each context. Interaction columns measure driver-observed action completion, including automation waits and, for multi-step selection, multiple actions. They do not measure field INP. These local synthetic runs cover the non-WebGL product journey. Real devices, real imagery, hosted latency and the 3D homepage need their own performance evidence.

The first isolated 3D pass finished with 23 passes and one laptop timeout while waiting five seconds for a live reduced-motion update. A repeat uses a bounded fifteen-second state assertion for the software renderer, preserving all behavior checks. The complete repeat passed all 24 cases in 5.6 minutes.


### Unconfigured production verification

The first full run built successfully and finished with 593 passes, 15 skips and 12 failures. All failures were the same HTTP-status expectation across four profiles. Three valid subcategory routes reached required catalog retrieval without a configured store and returned HTTP 500 with the existing branded error boundary. Removing the root streamed loading boundary makes that operational failure visible in the HTTP response. The previous assertions expected the old streamed HTTP 200.

The regression checks now require HTTP 500, the error heading and a Retry button for those valid unconfigured routes. Separate unknown-subcategory checks still require HTTP 404. D-094 records this behavior. The corrected complete run finished with 604 passes, 15 skips and one tablet WebKit animation-sampling failure. The opening-opacity check used a fixed 150ms timer that could run before the browser started interpolation. The corrected animation test samples the actual CSS transition timeline at its midpoint and resumes it, preserving real click/Escape and settled-state assertions. A focused run passed 12 cases across four profiles with three repeats each. The final complete production run passed 605 tests with 15 skips in 5.2 minutes.


### Review and scope boundaries

The final native security-engineer review and focused re-reviews reported no remaining confirmed security issues. Architecture review confirmed its catalog findings resolved. Independent test review accepted the explicit unconfigured-store response checks and the bounded software-GPU functional waits. Test timing fixes receive focused review and browser verification before publication.

The implementation selected a native Filter and sort disclosure at all widths and six representative hero garments. These choices follow observed product visibility and stress-fixture behavior. Synthetic size charts and illustrative CSS crops remain clearly identified. Original Claude configuration is unchanged.

Actual shopper usability sessions, speech output with assistive technology, browser magnification and physical-device checks remain open. The automated and expert walkthrough evidence supports the tested journeys and does not establish those pending results.


### Final integrated outcome

- Demo production browser coverage passed 536 cases with 18 skips across five profiles, including the separately isolated 24 software-WebGL checks.
- Unconfigured production browser coverage passed 605 cases with 15 skips across four profiles. The final complete run used the verified isolated production server. The 15 skips cover pointer-specific behavior on touch profiles and explicitly unsupported test contexts declared in the suite.
- Combined final browser coverage passed 1141 cases with 33 declared skips. Focused repeated tests overlap this total and are reported separately.
- Full unit verification passed 542 tests across 54 files. Production builds, formatting, lint and TypeScript validation passed. Final diff whitespace validation passed. All 81 local file links in the backlog resolve.
- The final security review reported no remaining confirmed findings. Architecture findings were resolved. The test specialist verified the animation correction across all four profiles with three repeats each.
- Item 18 remains open for actual magnification, screen-reader speech and physical-device evidence. Real shopper research also remains open. Policy approval, real product facts, final imagery and live service behavior retain their owner or account dependencies.

Publication follows the standing surfacebook-only branch safeguard. This record describes the validated implementation and the remaining evidence boundaries.


## Follow-up local accessibility and homepage audit

The owner requested the remaining checks without real products or connected services. The follow-up uses the same isolated Demo production environment, existing placeholder assets and independent specialist review.

### Reproduced findings

- At 390×844 with text-only enlargement to 200%, the single-row fixed-height header placed BAG beyond the right edge, up to x448. The header needs content-driven wrapping while preserving its ordinary 72px minimum.
- Chromium forced-colors mode removed the visible distinction between checked and unchecked variant labels after focus left the radio group. The shared picker needs a persistent selection cue that survives system color substitution.

These findings affect Header and the shared VariantPicker. The fixes use CSS and preserve existing navigation, radio semantics and commerce behavior. Both new regression checks failed against the old production build, reproducing 448px header overflow and identical selected/unselected appearance. The rebuilt production suite passed 119 affected cases with 11 declared skips across five profiles. Independent UI re-review confirmed both fixes. Read-only security review found no actionable issues.

### Audit method and evidence boundaries

Independent review exercised Chromium 151.0.7922.34 at 320×568, 844×390, 1024×768 and forced colors 1280×720, plus WebKit 26.5 at 320×568 and 844×390. Fresh-page text-only 200% captures covered 390×844 and 1280×844. Each capture doubled computed font sizes and line heights once, with all reads completed before writes. This establishes text-enlargement behavior.

Catalog filters, product selection, Quick Add, Size Guide, fullscreen gallery, Search, Menu, bag, empty saved-items states, access validation and reduced-motion looks were exercised. Gallery loading, failure and successful retry were observed. Four narrow keyboard-purchase repetitions passed. No participant research was performed.

Native Windows browser automation reached an app-approval timeout when launching Edge. No native speech or browser-menu observation was obtained from that attempt. The isolated Chromium-profile probe also failed to establish native zoom, as detailed below. Screen-reader speech, physical-device behavior and real shopper sessions remain pending their actual evidence.

The first homepage measurements are exploratory. The final isolated repeat is recorded below. Early samples overlapped static validation on the host, so their timings must not be treated as a controlled comparison. Software-rendered WebGL is explicitly distinguished from hardware GPU performance.


### Follow-up final evidence

- Production rebuild passed compilation, TypeScript checking and static generation. The two fixes introduce static presentation classes and retain the existing client state and server contracts.
- Full unit self-check passed 542 tests across 54 files. The integrated affected browser command used `test:e2e:demo --workers=2 --reporter=line accessibility-preferences.spec.ts navigation-accessibility.spec.ts product-selection.spec.ts product-information.spec.ts shopping-journey.spec.ts` with verified external production mode. It passed 119 cases with 11 skips in 3.4 minutes. Nine skips cover desktop-only hover/cursor behavior on touch profiles. Two skips exclude unsupported forced-colors emulation on WebKit.
- Independent re-review confirmed all 20 fresh-page text-enlargement captures fit at 390px and 1280px, every dialog fits its viewport, four 320px keyboard purchase repetitions pass, and Chromium/WebKit landscape journeys complete without overflow. Root visually inspected the enlarged header and forced-colors selected-state screenshots.
- Actual native zoom remains unverified. The Windows Edge launch reached an app-approval timeout. Full Chromium launch failed with `spawn UNKNOWN`, including the parent's escalated retry. The supported headless shell ignored the isolated-profile zoom preferences. Requested 200% and 400% probes retained DPR 1, innerWidth 1280 and visualViewport.scale 1. Those failed proof checks are excluded from successful zoom evidence. No user browser profile was modified.
- Screen-reader speech, physical touch devices and participant usability sessions remain unverified. The available checks are expert browser walkthroughs and browser automation.

### Controlled idle homepage measurements after the accessibility fixes

Windows i7-1065G7, Chromium 151.0.7922.34, 390×844, DPR 1, 4× CPU slowdown, 150ms latency and 200000 download bytes/second. Three fresh browser processes used disabled browser caches, with the local server image cache warm. All other audit and validation work paused during these runs. Build `rzvG_XJjBzBeBqtCgZPjj` includes the final accessibility CSS.

| Sample | LCP ms | CLS | Initial script transfer bytes | Longest initial task ms | Menu click Event Timing ms |
| --- | --- | --- | --- | --- | --- |
| 1 | 2876 | 0 | 175776 | 808 | 152 |
| 2 | 2380 | 0 | 175776 | 445 | 104 |
| 3 | 3096 | 0 | 175776 | 592 | 136 |

Median LCP was 2876ms. Menu driver-observed open completion ranged 435–639ms and includes automation waits. Event Timing samples do not establish field INP. The ordinary software-renderer guard retained the static hero in all natural samples. Scrolling the hero fully offscreen left the looks ring running at 51.4–59.9fps in the sampled windows. No request failures, page errors or console errors were observed.

The mobile LCP image was the 1920px hero optimizer response. It completed around 2.32–2.45 seconds. All three samples also downloaded a 3840px hero response. SHA-256 comparison confirmed the bodies were identical 38,454-byte WebP images. A bounded four-sample ABBA experiment removed only hero preload hints through identically routed document responses. Both responsive candidates still downloaded in every arm. Control LCP was 3076/2756ms and treatment 2696/2788ms, with CLS 0. Document routing limits absolute timing comparisons and hydration recreated a hint later. This experiment did not justify a loading-prop change. Critical image quality and portrait-cover sizing are preserved.

Mobile homepage LCP, initial main-thread tasks and duplicate hero candidate selection remain local optimization investigations. These findings are logged in the improvement backlog.

### Software WebGL diagnostic and limits

The host exposes ANGLE SwiftShader. Deliberate capability overrides exercised the real six-garment scene. The normal diagnostic signaled ready at 20.90 seconds, rendered around 0.97fps and completed selection, dismissal and pause. The reduced-motion diagnostic signaled ready at 12.68 seconds, rendered around 1.05fps and completed selection before its 120-second whole-sample deadline. Its offscreen check remained unverified. Both browsers closed after the bounded diagnostic.

Visible paused normal rendering recorded 160 draw calls over 3.95 seconds. Reduced-motion rendering recorded 240 calls over 5.72 seconds. Source inspection confirms visible Canvas rendering continues while motion is suppressed. Demand rendering is an efficiency follow-up requiring preservation of selection, camera, drag and transition behavior. These overridden software measurements do not establish hardware GPU performance. The application rejected the software path in every natural sample.

The earlier twelve exploratory desktop/mobile samples overlapped other workers' static validation and retain that limitation. Their raw observations informed investigation. The three idle final mobile samples above supply the final controlled timing evidence.
