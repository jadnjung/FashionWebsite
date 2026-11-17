# Full Search implementation plan

This implements backlog item 57 on base 7460f7f. Product-manager discovery is complete. Item 50's hosted unconfigured-suite investigation awaits authenticated logs, while its full local reproduction passed. Search work proceeds independently under the user's standing autonomous authorization.

## Proposed delivery

Keep the concise predictive overlay and add a server-rendered `/search` destination with a native GET form and a View all results action. Extend D-058 through a recorded decision when implemented. Preserve the current trimmed 2–100-character query contract, IME composition, cancellation, ten-second recovery, focus trapping and nested Quick Add keyboard ownership.

Offer full Search for valid committed queries, including preview-empty/error states. Preview counts describe displayed suggestions. A six-item preview alone does not establish that further matches exist. Enter submission must respect composition, and modified link activation remains native.

## Engineering contracts to resolve

- Predictive APIs return arrays. Verify the installed schema and existing query definitions before choosing paginated full-result methods. Preserve intended matching and visibility where the APIs permit, and document any actual predictive/full-result ranking differences. Avoid adding content types, filters or sorting options beyond the approved Search journey.
- Products and collections need separate bounded continuation, scoped to normalized query, group and ordering. New submission clears both cursors. Group pagination retains the query and the other group's current state. Invalid or mismatched cursors restart consistently.
- Use existing product cards, lifecycle destinations and native pagination patterns. Preserve sold-out reachability, upcoming collection access and item 71's separate owner-dependent policy.
- Keep counts page-scoped. Empty continuation sections retain useful navigation and explain their scope. Failures remain distinguishable from empty results. Item 58 owns independent lookup failure recovery, so this task retains the current combined failure policy.
- Make submission, direct entry, reload, Back/Forward, PDP return and no-JavaScript operation coherent. Provide identifiable focus/status targets without overriding deliberate focus movement.

## Privacy and SEO acceptance

Adding a Search query to a page URL requires checking automatic analytics as well as explicit events. Existing search-term redaction does not alone prove that GA4 page-location, referrer or enhanced site-search values are safe. Verify the actual integration before implementation and test navigation away from Search. Avoid raw-query logging, query persistence and duplicate attribution.

Use generic Search metadata with noindex and followable destination links, and exclude Search from the sitemap. Keep query text out of titles, descriptions and Open Graph copy. Verify this policy against applicable official guidance during implementation.

## Required evidence

Use deterministic fixtures matching at least 7 and 30 products and more than 6 collections. Enumerate expected IDs and prove reachability without omissions/duplicates through normal entry points. Cover partial queries, both groups, empty sections, invalid/stale cursors, failure/Retry, history, keyboard/mobile operation, no-JavaScript use and analytics privacy. Real populated-store relevance remains external verification.

The product review found no material business-policy blocker for this scoped proposal. Exact API matching and analytics URL mitigation still need engineering verification. Implementation, independent reviews and validation remain pending.

## Implementation tasks and progress

- [x] Inspect actual predictive APIs, overlay behavior, native entry points and current analytics contracts.
- [x] Reproduce the normal-entry-point gaps before application edits. The old optimized build returned 404 for GET /search, and its no-JavaScript header Search action remained on the homepage. Both browser cases failed as intended.
- [x] Resolve analytics privacy architecture with the data/analytics and security specialists using installed source and official documentation.
- [x] Implement typed, independently paginated product/collection results, scoped cursors and strict query validation.
- [x] Implement the server-rendered page, native header/form entry and overlay full-results navigation.
- [x] Integrate guarded analytics bootstrap, sanitized page context and manual pageviews, preserving explicit predictive-event semantics.
- [x] Prove complete fixture-ID reachability, recovery, URL/history/focus/no-JavaScript behavior and privacy boundaries.
- [x] Complete independent quality and security reviews, fix and re-review findings, then run parent integrated validation.
- [x] Update affected project documents, publish only validated owned files to surfacebook and inspect matching hosted CI.

The fullstack specialist owns application, query, generated operation-type, test and necessary sample-environment edits. The parent owns task documents, integration, reviews and publication. Use existing dependencies and limit generated-type changes to affected operations.

## Confirmed design choices

The full page uses native GET parameters q, productAfter and collectionAfter. Groups show up to 20 entries each. Cursors bind to normalized query, group and fixed ordering, with bounded opaque input. A combined typed Shopify operation preserves the current combined failure policy and uses the existing ten-second transport. Product full search uses the pinned schema's PRODUCT search connection, and collections use escaped title clauses with relevance ordering. Actual predictive/full-search ranking differences and the platform's result ceiling need explicit documentation. Demo fixtures prove local reachability, while populated-store relevance remains external evidence.

Header Search keeps button semantics through a native GET form whose JavaScript submission opens the overlay. Full results retain the editable form during failure. Retry reloads the same validated URL. New submissions clear both cursors, and each group's navigation preserves the other's state. Query text stays out of metadata and operational error logs.

## Live analytics provisioning change

Official documentation and installed source establish that send_page_view:false does not disable enhanced-measurement history pageviews, and automatic Site search recognizes q outside the application's explicit-event sanitizer. A measurement ID alone cannot establish safe behavior for the new query URL.

Require one explicit NEXT_PUBLIC_GA4_STREAM_PRIVACY_VERIFIED_FOR value equal to the configured measurement ID before loading the remote tag. The owner must first verify that stream's automatic Site search and history-based pageviews are disabled. Changing the ID invalidates the matching assertion, and changing stream settings requires re-verification. This is a technical provisioning assertion and does not represent visitor consent. The source currently has no analytics-consent implementation.

Controlled initialization sets safe initial page location/referrer and disables the config-load pageview. Manual pageviews and explicit events receive sanitized context, including navigation away from Search. Keep local Preview capture supported. Replacing the Next GoogleAnalytics component also requires an owned event queue, because the old sendGAEvent wrapper depends on that component's private initialization. Search sends an origin-only referrer policy through response headers and metadata. Actual live stream receipt and duplicate-event behavior remain account-dependent verification.


## Recovery and integrated checks, November 17 at 15:49 UTC

Account capacity recovered and all existing specialists resumed. The implementer recovered optimized server session 94460 with the intended Demo/45-collection markers; a restricted process inventory had hidden its listener. Avoid starting a second server from an empty restricted inventory alone.

Primary quality review verified the malformed DTO fix and ran 48 focused tests. Security review verified the encoded-path sanitizer/bootstrap fix, response headers, exact-ID provisioning gate, request bounds and dependency removal. Their common reviewed 34-path manifest was ca04a6e69dd683bdbe5b79aef833866f44b59b970c18bf942f51781c12cca4b7. Analytics review then found ordinary-page fragments could advance virtual event context despite being excluded from manual pageviews. One RED regression confirmed this, and clearing fragments for all accepted analytics URLs passed ten context tests. Analytics re-review found no further confirmed code defect. Security re-review cleared the fragment fix, exact fake-tag test isolation and privacy copy. Its final 36-file source/config/test fingerprint was 162b5e3e3282f8decdc0db40acd5762b84b614544360791a38fdeecfe9a92c41. Quality follow-up also found no new issue and passed all ten context tests.

Parent integrated checks after that sanitizer change passed 629 unit tests across 61 files (session 29256), lint (23404), typecheck (91103) and whole-repository formatting. A local-document target check passed 246 links and sequential backlog numbering 1–75. Its initial naive parser truncated parenthesized source paths; the corrected parser validated balanced path parentheses with no missing targets.

The first 55-case optimized browser run exposed test assumptions requiring correction: collection pages with the same count need destination and first-record waits; an empty GET form may end in a bare question mark; encoded Search aliases actually return HTTP 404 in the optimized runtime. Earlier filesystem-source inference of HTTP 200 was incorrect. Test the actual 404 error shell and its origin referrer header, while unit/bootstrap probes retain conservative sanitization coverage. These failures do not establish a new application routing defect.

Final corrected browser execution, isolated fake-GA positive profile and normal shopping-journey regression remain pending. Actual live analytics settings/receipt and the separate hosted-CI item 75 remain external dependencies. No item 57 commit or push has occurred.


The corrected normal optimized large-catalog browser run 77227 passed all 55 cases in 1.1 minutes. The extra route-announcer match in one alert assertion was scoped to main before the final run. Parent inspected mobile/desktop full-page screenshots: content fits and long names wrap. The mobile capture included undecoded/lazy images, so it supplies layout evidence rather than final image readiness; no image-code change was inferred from it. A decoded viewport follow-up remains planned.

Analytics review cleared the strengthened positive test design: exact fake-ID whitelist, unexpected Google request assertions, sensitive-query queue snapshots and explicit Back/Forward pageview/context checks. The local stub verifies application-issued commands, not actual Google SDK processing or authenticated receipt. Normal suites intentionally skip this profile-only case. Fake-ID optimized build/start is implementer-owned session 23824, with matching public G-ESQUETEST ID/assertion, Preview capture off, Demo/45-collection fixtures on and service credentials empty. Normal launcher continues to clear analytics IDs by design.


The fake-ID optimized build succeeded in session 23824. Partial positive browser evidence confirms the actual emitted bootstrap executes safely and native Search submission sends an origin-only Referer. Browser assertions were corrected for direct page.goto having no referrer and for waiting until native document navigation commits.

A separate history probe found direct location.hash assignment created entries with empty history.state, dropping Next router markers. Returning to that entry changed the URL while retaining PDP content. The analytics test will exercise hash-only navigation through the router-integrated history.pushState API, and verify committed DOM and pageviews during Back/Forward. The native-fragment observation remains a controlled-probe compatibility question, not a dismissed or fixed normal-shopping defect. Reproduce it through a real application anchor before broadening runtime scope.


## Positive configured-profile result and reproduction

Fake-ID suite session 8603 exited 0 with all five browser-profile cases passing in 14.6 seconds. It exercised production-emitted initialization, safe initial/current/prior context, origin-only native referrers, pagination and PDP/wishlist attribution, fragment exclusion, committed Back/Forward pageviews, reload and no duplicate Search event. No unexpected Google requests occurred. The dedicated fake-ID server was stopped before the parent default-profile build.

Reproduce the isolated positive build in a clean PowerShell process without editing environment files. All IDs below are public test placeholders. Normal test launchers deliberately clear these settings.

```powershell
$env:NODE_ENV='production'
$env:PREVIEW_DEMO_MODE='1'
$env:PREVIEW_COLLECTION_SCENARIO='continuation-45'
$env:SHOPIFY_STORE_DOMAIN=''
$env:SHOPIFY_STOREFRONT_API_TOKEN=''
$env:KLAVIYO_PRIVATE_API_KEY=''
$env:KLAVIYO_LIST_ID=''
$env:ESQUE_DROP_ACCESS_CODE='fixture-drop-grant-53'
$env:NEXT_PUBLIC_GA4_MEASUREMENT_ID='G-ESQUETEST'
$env:NEXT_PUBLIC_GA4_STREAM_PRIVACY_VERIFIED_FOR='G-ESQUETEST'
$env:NEXT_PUBLIC_PREVIEW_ANALYTICS=''
$env:NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=''
$env:NEXT_PUBLIC_SUPPORT_EMAIL=''
$env:NEXT_PUBLIC_SITE_URL='http://localhost:3000'
$env:BROWSER_TEST_PROFILE='demo-drop-grant-isolated'
$env:BROWSER_TEST_DROP_GRANT_PROFILE='demo45-grant'
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
python -B -X utf8 .codex/tools/run_project.py build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
python -B -X utf8 .codex/tools/run_project.py start
```

In a separate process, set PLAYWRIGHT_PRODUCTION=1, PLAYWRIGHT_EXTERNAL_SERVER=1 and PLAYWRIGHT_ANALYTICS_STUB=1, then run `python -B -X utf8 .codex/tools/run_project.py test:e2e:collections analytics-privacy.spec.ts --reporter=line`. Stop the server afterward. The case is intentionally skipped in ordinary profiles; its exact fake tag is fulfilled locally and other matched Google requests are aborted and asserted absent. This does not execute Google's real SDK or verify a live property's collection settings.

The implementer's final 35-path manifest is 07edd762045d3a31bf40bf5ef7408fbc3af827611555ead405eb0fe7f7fe5b65 using sorted path:lowercase-SHA256 lines joined with LF, then UTF-8 SHA256. This excludes parent-owned policy copy and documents. Parent final default-fixture optimized build session 26105 succeeded, and sessions 64584/73394/6773 passed final typecheck/lint/format checks including the final browser specs. Parent 95-case shopping/recovery/deadline run is in progress as 73996.


Parent default-profile run 73996 exited 0 with 92 passing cases and three intended mobile modifier-key skips in 3.2 minutes. All 25 shopping-journey cases passed. The run also covered Search/Quick Add ten-second header/body deadlines, cancellation/late completion, transport failure, recovery, IME/length limits and long-name layouts. Server 26105 was stopped before the unconfigured build. Final no-service Search validation is pending on server/build session 88189.

Parent inspected a decoded 390×844 mobile viewport after fonts and first/later images loaded. First-image decode reported natural dimensions 390×487. No horizontal clipping or new layout issue was observed in this sampled state. This is screenshot/browser evidence, not physical-device or screen-reader speech certification.

Final mandatory security re-review cleared the last test-only navigation/referrer changes, retaining exact fake-ID interception and aborting other matched Google requests. Parent independently recomputed the implementer's 35-path fingerprint and it matches 07edd762045d3a31bf40bf5ef7408fbc3af827611555ead405eb0fe7f7fe5b65. Including the parent-owned privacy copy, the parent path:hash manifest is 68560db0b7c7a131d9426ce434e2272a535d0824d34aaa396410500f9640a233. Security's separate manifest algorithm reports fe599a50cfe4fc6ba4158cb07936704bf47966760e8635f1f287e0f6d964e54d; these distinct algorithms are not claimed identical.


## Final local completion

Unconfigured optimized Search run 30262 exited 0 with 70 passes and two intended native-clear target skips in 49.2 seconds. It covered native no-JavaScript entry, noindex metadata, retained-query failure/Retry and existing overlay focus, mutual exclusion, category navigation and reduced-motion behavior. Server 88189 is stopped.

Final browser totals are 222 passing and five intended skips across normal large-data 55, fake-GA 5, default Demo 92/3 skips and unconfigured Search 70/2 skips. All 25 shopping-journey checks passed. Parent full units passed 629/61 files, final lint/typecheck/formatter passed and optimized builds succeeded in large-data, fake-GA, default Demo and unconfigured modes. Review findings were fixed and re-reviewed. No live Shopify/GA4 account behavior is claimed. Item 57 is locally complete; branch-only publication and matching CI remain the final steps.


## Publication

Branch was verified exactly surfacebook before commit and again before push. Published e1e4ac8dad8fd42871db59558d4a2effe5b87859 with explicit destination HEAD:refs/heads/surfacebook, and ls-remote confirmed the same revision. Hosted CI [44123444619](https://github.com/jadnjung/FashionWebsite/actions/runs/44123444619) is in progress. Agent setup passed; the app job reached browser installation. Full hosted completion remains pending. No credentials were read to inspect public status. A Python certificate-store mismatch was handled by using native Windows trust, without disabling TLS verification.


The public job detail subsequently confirmed success for agent setup, formatter, lint, typecheck, unit tests, production build and the full unconfigured browser suite at e1e4ac8. Demo was still running and collections pending at that snapshot. The older revision's unconfigured failure remains unexplained; a newer successful run does not establish its cause.


## Hosted completion recovered after capacity reset

Public API verification after the usage interruption reports hosted CI 44123444619 completed SUCCESS at exact published e1e4ac8dad8fd42871db59558d4a2effe5b87859. All configured jobs and suites therefore passed. Item 57 is published and hosted-verified. Its live-account/catalog verification boundaries remain as recorded.


The D-103 collections-profile follow-up adds a real-action fixture code and distinct existing browser-profile marker. The current fake-GA reproduction block above now includes that fixed public code and matching profile pins, so the external-server verifier accepts the revised collections configuration. Its fake-ID, stream assertion, Preview-off and blocked/stubbed Google traffic requirements retain their original scope.
