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
