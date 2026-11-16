# Shopping reliability and production validation implementation plan

Use feature-dev and the applicable Superpowers implementation, debugging and verification skills. The parent performs engineering-lead coordination, integration, validation and publication.

The goal is to complete the user's five ordered groups, starting with items 59, 52, 47, 49 and 48 and a complete shopping-journey regression run. Existing React/Next.js components, canonical Demo records and isolated browser servers remain the implementation foundation.

## Ordered delivery

- [x] First batch covers failed-operation cart retry ownership, malformed analytics cookies, URL/form synchronization, Quick Add response ownership and full client request deadlines. CartProvider, ShellClient/cookie helper, FilterBar, QuickAddPanel and SearchOverlay are the affected entry points. Add regressions that reproduce the existing failures before fixing them.
- [x] Integrate and review the first batch. Run formatting, lint, TypeScript, units, production build and complete local shopping journeys. Record actual results before continuing.
- [x] Accessible recovery covers forced-colors pointer fallback, visible gallery recovery while zoomed, form-level failure focus and coordinated background scroll locking for native dialogs. Preserve internal scrolling, nested overlays, focus restoration and reduced motion. Items 54, 66, 67 and 68.
- [x] Product confidence covers selected-variant bag imagery, useful remaining-capacity guidance and consistent structured offer facts. Verify the related cart boundary when modifying the Demo operation implementation. Items 60–63.
- [x] Production checks cover optimized browser execution in CI, canonical URLs for distinct continuation pages and an explicit bounded freshness policy for homepage/sitemap output. Items 64, 65 and 69. Record durable metadata/cache decisions in DECISIONS.md.
- [x] Complete independent quality/UI/security reviews, resolve confirmed findings and re-review fixes. Run integrated checks appropriate to the final changes. Update current backlog statuses, roadmap and this execution record with limitations and actual evidence.

Publication follows AGENTS.md. Verify surfacebook before each commit and explicit push to refs/heads/surfacebook. Preserve Claude files, credentials and unrelated edits. The published branch's [CI runs](https://github.com/jadnjung/FashionWebsite/actions/workflows/ci.yml?query=branch%3Asurfacebook) record hosted validation separately from the local results below.

## Ownership and state contracts

Cart specialist owns CartProvider and its focused retry regression. Request specialist owns QuickAddPanel, SearchOverlay, an appropriate client request helper if needed and its focused regressions. Filter specialist owns FilterBar and URL/form regressions. The parent owns cookies, integration, documentation and later routing. Workers share the checkout and preserve each other's work. They do not publish.

Applied filter criteria and sort identify a native form instance. Committed criterion changes reset controls from the URL. Cursor-only navigation preserves edits to controls that remain rendered while the applied criterion set stays the same. Backlog item 72 tracks draft controls absent from later facet pages. GET submission remains progressively usable.

Search and Quick Add use a ten-second complete client request budget, including JSON decoding. Closing or superseding a request cancels its ownership. A timeout reaches recovery UI. A late response cannot commit state after cancellation or replace a newer session. Each current successful Quick Add opening follows the documented fresh-selection behavior. A response from an older opening cannot reset choices made in the current session.

Cart recovery represents the actual failed operation. A background restore failure must not replay a previously acknowledged add. Existing cancellation, locking and supported storage formats remain part of the contract.

## Validation and evidence boundaries

Use the isolated Demo production harness and synthetic service responses. Browser rendering-mode checks verify the server. A full shopping journey includes discovery, filters, product selection, Quick Add, saved items, bag changes, recovery and keyboard operation. Resource-heavy software-WebGL checks run separately when affected.

Actual screen-reader speech, native browser magnification, physical devices and live services require their own evidence. Existing unchanged-scope results may be reused with their original limits. The daily audit automation stays paused as requested.

## Execution record

Started November 16, 2026 from surfacebook revision 7b754db. The pre-existing untracked browser debug.log is outside the implementation scope. The user authorized routine commands, edits, validated commits and pushes only to surfacebook.

### Reproduction and first integration

The old optimized Demo build reproduced six cart retry failures, three URL/form failures, malformed-cookie parser failures, Search header/body stalls, Quick Add decoding stalls and the old-opening race. Cookie tests initially failed three malformed values and passed after guarded decoding. The client helper's six unit cases verify a single budget across headers and JSON, cancellation and late transport completion.

The first 145-case integrated run completed with 123 passes and 22 failures. Twenty failures came from four Search test selectors across five profiles. Recovered product links include image alt text in their accessible names. Two WebKit history failures came from opening filter disclosures before the replacement form committed. The tests now target product destinations and await rendered sort state. A corrected Chromium/tablet run passed all 24 affected cases. The original run passed all 25 shopping-journey cases across the five profiles, including analytics, form recovery and no-JavaScript product browsing.

Accessibility regressions reproduced five expected failures and passed two preservation checks on the old build. The remaining-capacity and variant-media regressions reproduced their old behavior. Canonical cart/quantity regressions failed before the fix and passed afterward. Offer and pagination units exercised the previous metadata failures.

### Integrated validation

Parent-run lint, formatting and 565 unit tests passed before the final header adjustment and two additional freshness tests. The optimized Demo build compiled successfully and its route table and prerender manifest show 60-second revalidation for the homepage and sitemap. Subsequent checks cover the final changes below.

The full normal Demo browser run exposed an existing 320px header failure with BAG (99). After fonts loaded, the wordmark measured 47.1875px and utility navigation 245.234375px against a 288px inner row. Mobile MENU horizontal padding is reduced from 8px to 4px, preserving its minimum height and desktop padding. The final rebuilt browser run below verified this adjustment, including enlarged text.

Local cache probes observed sitemap `STALE` and later successful cache reuse, with regenerated sitemap output. The homepage output modification time advanced during repeated requests, and its response advertised `s-maxage=60`. Both manifest entries specify `initialRevalidateSeconds: 60`. Controlled tests advance the release clock, replace published product/collection records, inject a temporary retrieval failure and verify recovery. These compose local refresh-policy evidence. Hosted cache propagation, actual store publishing and a production regeneration failure still require connected deployment evidence.

Independent quality review covered the integrated source and found no introduced actionable defect. It confirmed a pre-existing facet-pagination draft loss, now open backlog item 72 with a direct browser reproduction. The read-only security review covered the full source/configuration changes and passed 65 focused boundary tests with no actionable finding. The follow-up review below covers the final header and freshness-test additions.

The broad optimized normal Demo run executed 760 cases with three workers. It recorded 728 passes, 23 intended skips and nine failures. Five failures were the 320px header layout described above. Two new test failures attempted mouse-wheel injection unsupported by mobile WebKit, and one sent the cursor initialization event before the live preference update mounted its listener. The corrected tests use keyboard PageDown on mobile WebKit and repeated real pointer movement with a controlled eligible-device profile. One mobile WebKit look test timed out during the loaded run and passed three isolated repetitions. The final affected-scope run uses two workers and repeats that journey.

Parent-run final units passed 567/567 across 56 files. Lint, formatting and standalone TypeScript passed. Quality and security reviewers independently checked the final header, freshness tests and accessibility-test adjustments. The focused freshness run passed 10/10. Both homepage and sitemap returned `STALE` followed by `HIT` on local optimized-server requests. The reviewers found no actionable introduced defect. The plan's retained-filter-control wording was aligned with D-096 and item 72. All 185 local Markdown targets checked across the changed documents resolve.

The final rebuilt affected-scope Demo run passed 216 cases with 14 intended skips, exit 0, using two workers. It covered accessibility preferences, accessible recovery, bag operations, navigation, product confidence and all 25 shopping-journey cases across the five profiles. All nine failures from the broader run passed in this final run. The separate software-WebGL closet suite passed 24/24 with one worker, exit 0.

Independent UI review used actual Chromium rendering and inspected screenshots at 320, 390, 768 and 1440px. Mobile MENU measured 58×50px, with no horizontal PDP overflow. Gallery Retry stayed visible after panning, nested overlays retained the correct scroll lock, service-error focus respected ownership, alternative variants and look exclusion enabled recovery, and selected variant media survived quantity updates and reload. The review reported no introduced UI/accessibility finding and zero uncaught page errors. This visual pass used mostly reduced motion. The automated suites supply their separately recorded WebKit and graphics coverage.

### Controlled post-build release

An ignored test-only Node preload controlled zero-argument Date construction in the isolated build/server. Native `Date.now` retained real cache timing. Security review verified the harness, including native cache-clock identity and explicit Date arguments. Production application files and integration isolation were unchanged by the experiment.

The optimized Demo build used November 20, 2026 at 11:59:59 UTC. Initial cached homepage HTML contained the Collection 002 teaser, the sitemap excluded its collection route, and its dynamic detail route showed the early-access gate. Advancing the application calendar to 12:01 removed that dynamic gate immediately. Homepage and sitemap remained cache hits with their pre-release content before eligibility.

After the real 60-second interval, the first requests returned `STALE`. The following requests returned `HIT`, with the homepage teaser removed and the newly released collection present in the sitemap. Both assertions passed. This demonstrates an actual lifecycle transition after build, composed with the controlled publication/removal and transient-read-failure tests. Hosted propagation and real upstream regeneration-failure behavior retain their stated evidence requirements. The controlled server was stopped before running the ordinary unconfigured production suite.

### Final unconfigured and repository checks

The full unconfigured suite owned its isolated optimized build and server, matching the revised CI selection. It passed 605 cases with 15 intended skips, exit 0, across Chromium desktop/laptop and WebKit phone/tablet. Missing-store errors in the server log are intentional failure-state scenarios covered by these assertions. Both production configurations built successfully.

Migration validation passed source integrity, skill dependencies, hook payload and secret-pattern checks with 26 agents and 12 skills. All four agent contract tests passed. Protected Claude files have no diff. Final application/test hashes match the security-reviewed scope. Remaining evidence includes physical devices, actual assistive-technology speech, native magnification, real service transactions and hosted cache propagation. The daily audit remains paused.
