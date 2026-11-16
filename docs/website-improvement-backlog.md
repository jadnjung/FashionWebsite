# Website improvements you can complete with demo products

Use this backlog to improve Esque’s reliability, accessibility, presentation, and shopping experience before final products and external service accounts are available. Each item includes current evidence, a local demonstration, and a completion check. The backlog now contains 58 numbered items, including 12 additions from the latest audit. Shopify is the commerce platform referenced in this document.

Reviewed on November 14, 2026 against commit `d6cf965` on `surfacebook`. The original findings were open at the audit baseline. The implementation record below tracks the subsequent remediation and verification pass. Priorities are proposed implementation order. Expanded on November 14, 2026 with detailed behavior, edge cases, feature packages, and implementation handoffs. The added specifications describe proposed future work.

## New open items from the audit at revision 412476b

This audit added items 47–58 on November 15, 2026. The table records their current evidence and priority. Their detailed specifications follow item 46. Application fixes remain future work. The completed implementations and earlier audit observations retain their dated records below.

| Item | Priority | Open finding or improvement | Evidence |
| --- | --- | --- | --- |
| 47 | P2 | Removed filter chips leave stale form choices that Apply restores | Browser reproduced |
| 48 | P2 | Search and Quick Add need a deadline for stalled client requests | Search browser reproduction and both components inspected |
| 49 | P2 | Late Quick Add success can reset choices from a newer opening | Browser reproduced with a delayed, abort-ignoring decoder |
| 50 | P2 | Collection and archive indexes stop at the first 20 collections | Source confirmed |
| 51 | P2 | Saved lists launch unbounded refreshes and refetch survivors after removal | Browser reproduced with 100 synthetic entries |
| 52 | P2 | Malformed analytics-cookie encoding can break the storefront shell | Browser reproduced and actual parser probed |
| 53 | P2 | A drop-granted signal added after shell mount is missed during client navigation | Browser signal-lifecycle reproduction |
| 54 | P2 | Request Access service failures leave keyboard focus on the page body | Browser reproduced |
| 55 | P2 | Purchase-intent analytics loses selected quantity | Source-confirmed information gap |
| 56 | P3 | Accidental saved-item removal needs an Undo action | Enhancement proposal based on current removal flow |
| 57 | P2 | Predictive Search needs a route to the remaining matches | Source-confirmed discovery limit and enhancement proposal |
| 58 | P3 | Search should retain useful groups when one lookup fails | Enhancement proposal requiring a documented policy decision |

The browser reproductions used Chromium 151.0.7922.34, the isolated production Demo build, synthetic contact values and browser-local data. The audit used a 390×844 viewport for filter, form and analytics checks, and 1280×900 for the Quick Add race. Saved-list and stalled-search probes used Chromium's default desktop viewport. It made no real subscriptions or purchases. The existing homepage performance investigations remain open with their earlier measurement evidence.

## Implementation record updated November 15, 2026

The following statuses describe the local implementation pass. The original numbered descriptions preserve the discovery evidence. Integrated verification is recorded in the execution plan, including failures corrected during the pass and remaining device or external-service evidence. [Execution and validation record](./superpowers/plans/2026-11-14-backlog-completion.md)

| Item | Local status | Implemented outcome or remaining evidence |
| --- | --- | --- |
| 01 | Implemented | Guarded storage acquisition, validated bounded v1 history, session fallback and legacy regression tests. |
| 02 | Implemented | Included outfit pieces resolve sellable variants before atomic addition, with local guidance and recovery. |
| 03 | Implemented | Wrapping and constrained containers cover cards, navigation, overlays, saved content and product controls. |
| 04 | Implemented | Readable menu, search and category hover treatments with normal/reduced-motion browser assertions. |
| 05 | Implemented | Contextual availability guidance preserves recoverable choices across the shared picker. |
| 06 | Implemented | 44px option labels verified in the independent multi-width walkthrough. |
| 07 | Implemented with synthetic data | Garment-specific charts, inch/cm conversion, measurement instructions and missing-chart guidance. |
| 08 | Implemented | Native GET facets, chips, same-variant matching, independent progressive option discovery and bounded reads. |
| 09 | Implemented | Category, current collection and archive product continuation retain cursors and explain page counts. |
| 10 | Implemented | Thirty canonical fixtures include default, sparse, absent media, long labels, unknown inventory and101-variant cases. |
| 11 | Implemented | Shared image fallback across cards, stack, bag and history, with fullscreen retry coverage. |
| 12 | Implemented and regression-covered | Populated search recovery and acknowledged delayed-response ownership tests. |
| 13 | Implemented and regression-covered | Lock waits, disconnected/malformed updates, unavailable Web Locks and late completion checks. |
| 14 | Technical descriptions updated | Privacy/accessibility copy reflects current storage, collection access and conditional analytics. Final policy approval remains an owner dependency. |
| 15 | Implemented | Owned isolated test servers pin external integrations. Explicit external reuse verifies mode, production rendering and isolation profile. |
| 16 | Implemented | Production build/start harness and two-mode smoke command support repeatable optimized-browser checks. |
| 17 | Measurement tooling implemented | Three-sample cold mobile measurement command records LCP, CLS, transferred scripts and Search, variant, gallery and bag completion timing. The execution plan tracks the measurement run. |
| 18 | Local text and forced-colors checks completed, manual evidence pending | Follow-up 200% text and forced-colors audits found and fixed header overflow and lost variant-selection cues. Actual browser magnification, screen-reader speech and physical-device testing still need evidence. |
| 19 | Automated improvements implemented | Search uses one concise persistent status region. State-specific browser checks and expert review cover the changed journeys. Screen-reader speech verification remains pending. |
| 20 | Implemented | Opt-in local browser event capture verifies named events, counts and Demo semantics. Obvious personal data in Search is redacted. |
| 21 | Implemented | Actual SDK HTTP tests cover variables, normalization, errors, cancellation, response-body deadlines and continuation. |
| 22 | Implemented | Demo subscription success/failure, consent validation, retained input, focused recovery and accurate acknowledgement wording. |
| 23 | Implemented with illustrative assets | One licensed source supplies coherent CSS gallery crops with matching fullscreen treatment. Existing category-aware closet geometry remains provisional. |
| 24 | Implemented and browser-verified | Removed the root streamed loading boundary and isolated optional recommendations. Primary product content and original gallery links remain readable with scripts disabled. |
| 25 | Report-only evaluation implemented | Optional local policy supports compatibility inspection. The execution record tracks observed results and enforcement tradeoffs. |
| 26 | Implemented | Ten-second bag deadline includes lock waiting, fetch and decoding, with safe cancellation and late-commit rejection. |
| 27 | Implemented | Wishlist products refresh independently with per-item deadlines, freshness and retry. |
| 28 | Implemented | Known missing saved products retain snapshots/removal while purchase links and Quick Add are suppressed. |
| 29 | Implemented | Recommendation loading/failure is isolated under Suspense. A route-level regression checks primary construction and local recovery. |
| 30 | Implemented | Validated variant URLs support reload, history, copied destinations and bag-to-product restoration. |
| 31 | Implemented | Live product/look continuation retrieves later variants. Actual SDK regressions protect the101st variant and cursor failures. |
| 32 | Implemented | Ordinary same-product Search navigation closes the overlay, preserving modified activation and Quick Add. |
| 33 | Implemented | Visible breadcrumbs use the known product taxonomy and ordinary category destinations. |
| 34 | Implemented | Support promises follow configuration, with useful draft policy destinations in the unconfigured state. |
| 35 | Implemented | Countdown advances supplied server time using monotonic elapsed time, refreshes at completion and keeps authorization server-side. |
| 36 | Implemented | Locked collections expose a real page heading. |
| 37 | Implemented | Product metadata uses the product image with a brand fallback. |
| 38 | Implemented | Dark color scheme and browser theme metadata define native-control presentation. |
| 39 | Implemented | Request Access retains initial reading context and focuses invalid fields or the completed outcome deliberately. |
| 40 | Implemented | Explicit selected-color image navigation preserves manual gallery browsing and unmapped fallback. |
| 41 | Implemented | Product/collection sitemap enumeration follows continuation and excludes upcoming collection pages, with exact exclusion assertions. |
| 42 | Implemented | Empty-state membership checks exclude sort-only changes. |
| 43 | Implemented | Closet CLOSE and Escape restore the relevant garment focus target. |
| 44 | Implemented | A persistent pause choice controls automatic closet sway and rotation. |
| 45 | Implemented | Live reduced-motion subscriptions update closet and cursor behavior during the visit. |
| 46 | Implemented | Shared length rules preserve composed input and keep UI, transport and event intent consistent, with privacy redaction at the analytics boundary. |

### Additional issues found during implementation

- Bounded matching scans and independent option pagination address catalog request amplification, disappearing later facets and selected-value loss. Collection membership discovery follows continuation beyond 250 memberships under the shared deadline.
- Current collection browsing now continues beyond its first 24 products. The homepage keeps six representative closet garments and links into the full collection browsing journey.
- Native submission resets were clearing Request Access values after a recoverable failure. The form now preserves entered email and consent for retry.
- Gallery detail crops now retain the same treatment in the fullscreen viewer. Decorative failed hover images preserve the healthy primary image.
- The expanded mobile filter controls originally pushed the first product to approximately 906–950px. A compact native Filter and sort disclosure restores the product-first hierarchy while preserving GET submission and no-JavaScript operation.
- Analytics now redacts obvious email addresses, phone numbers and URLs entered into free-text Search.

The local history implementation retains valid v1 records and a bounded list. Timestamp-based expiry remains an optional schema extension. Final photography, measurements, business policy approval, live transactions, actual email delivery and account connections retain their original owner/service dependencies.

## Follow-up local checks on November 15

The follow-up audited the rebuilt Demo website with placeholder products. The original 46-item inventory is retained above. These additional findings and evidence boundaries inform the next pass.

| Finding | Status | Evidence or next work |
| --- | --- | --- |
| Enlarged text clipped the mobile header | Fixed and verified | At 390×844 with text doubled once, BAG previously reached x448. The header now wraps within its bounds. All 20 fresh-page captures at 390px and 1280px fit. |
| Forced colors hid variant selection | Fixed and verified | Checked native radios now retain a double-underlined label after blur. Focus and disabled cues remain visible in Chromium forced-colors emulation. |
| Mobile homepage loading exceeds the lab target in some samples | Open investigation | Three idle cold mobile runs measured LCP 2876,2380,3096ms and CLS 0. Startup long tasks reached 445–808ms. Continue profiling critical loading and main-thread work under the same conditions. |
| Hero downloads duplicate responsive candidates | Open investigation | Both 1920px and 3840px optimizer requests returned identical 38,454-byte WebP bodies. A four-sample controlled preload-removal experiment retained both requests. Determine the cause before changing loading behavior, while preserving portrait-cover detail. |
| Visible paused or reduced-motion 3D scenes continue drawing | Efficiency follow-up | Forced SwiftShader diagnostics confirmed draw calls continue. Normal capability detection rejected software rendering. Hardware GPU cost and a safe demand-rendering design remain unverified. |

The changed Header and shared VariantPicker passed 119 affected production browser checks with 11 declared skips across five profiles. Independent UI review verified the fixes and repeated keyboard/touch-emulated shopping journeys. Read-only security review found no actionable issues. Full methodology, measurements and limitations are in the completion record. [Follow-up execution record](./superpowers/plans/2026-11-14-backlog-completion.md#follow-up-local-accessibility-and-homepage-audit)

Native 200%/400% browser zoom remains unverified. Edge automation reached an app-approval timeout. The installed full Chromium executable failed to spawn. The supported headless shell ignored isolated-profile zoom preferences and retained DPR 1 and a 1280px viewport, so those attempts supply no native-zoom evidence. The successful 200% text checks used explicit font and line-height enlargement. Screen-reader speech, physical-device testing and actual shopper sessions still need their own evidence.

## Start with the four reproduced issues

The local Chromium audit confirmed four failures using the existing Demo website. Resolve these before expanding the feature set.

The audit used headless Chromium 151.0.7922.34 through Playwright 1.62.1 on Windows. The local Next.js 16.3.1 production server ran at `http://localhost:3000`, with `PREVIEW_DEMO_MODE=1` during build and startup. Evidence consists of DOM, computed-style, and network observations from fresh browser contexts.

| Item | Viewport | Local reproduction |
| --- | --- | --- |
| 01 | 390 × 844px | Make the `window.localStorage` getter throw `SecurityError`, then open `/products/preview-featherweight-crewneck` |
| 02 | 1440 × 900px | Enable reduced motion, open LOOK 02, choose crewneck S/Ecru and trouser M/Black, then activate ADD LOOK |
| 03 | 320 × 800px | Seed a v1 wishlist entry whose title repeats `PlaceholderName` fifteen times, return HTTP 503 from the product refresh, then open `/wishlist` |
| 04 | 1440 × 900px | Open MENU, hover TOPS, and inspect the settled text and menu background colors |

| Item | Priority | Finding | Evidence |
| --- | --- | --- | --- |
| 01 | P1 | Blocked browser storage replaces the product page with the generic error screen | The crewneck heading disappeared after the `localStorage` getter threw |
| 02 | P1 | An unavailable outfit combination enables ADD LOOK and then produces no feedback | LOOK 02 with crewneck S/Ecru produced zero cart requests and left BAG (0) |
| 03 | P1 | A long saved-item name breaks narrow-screen layout | A 320px wishlist measured 2030px of document width during an availability failure |
| 04 | P1 | Navigation hover text loses readable contrast | Rendered text used `rgb(31, 61, 43)` over `rgb(5, 5, 5)` |

P1 addresses failures that prevent progress or readability and potentially blocking reliability risks. Each finding retains its reproduction status. P2 completes existing journeys and their verification. P3 covers scoped design or architecture proposals. Items identified through source inspection or missing test coverage say so explicitly.

## Preserve the completed shopping features

The current baseline includes gallery navigation, fullscreen image zoom, swipe handling, image retry, mobile purchase feedback, a simulated bag, wishlist recovery, and product-information sections. Their remaining gaps appear below. The earlier implementation and validation record documents their completed coverage. [Storefront readiness record](./superpowers/plans/2026-11-13-storefront-readiness.md)

## P1 fixes

### 01. Keep product pages usable when browser storage fails

**Confirmed in the local browser.** `RecentlyViewed` accesses `window.localStorage` before its helper can catch storage errors. In a fresh browser context, replacing that getter with a throwing `SecurityError` changed the crewneck page to SOMETHING WENT WRONG and Retry. The helper also accepts an array of unchecked history entries, so malformed records need defensive handling. [Recently Viewed component](../components/product/RecentlyViewed.tsx#L50), [history parser](../lib/product/recently-viewed.ts#L30)

- Demonstrate blocked storage access, quota failure, malformed JSON, null entries, invalid image URLs, and a valid older history record.
- Guard storage acquisition and validate individual records. Preserve valid history and useful in-session behavior where possible.
- Complete when the product heading, options, gallery, wishlist, and Demo bag work through each storage failure. Add focused regressions for the reproduced crash and malformed records.
- Route to frontend-engineer, with qa-engineer verification.

#### Detailed behavior and verification

- **Recovery behavior.** Catch both storage acquisition and read/write failures. Keep the current page usable, discard only invalid history entries, and use bounded in-memory history for the active session.
- **Record rules.** Validate version, handle, title, destination, image shape, and timestamp before rendering. Deduplicate by product identity, cap history length, and handle expired or deleted products deliberately.
- **Regression proof.** Open a PDP with a throwing getter, navigate to a second product, and return. Repeat with mixed valid/invalid records and quota-exceeded writes. Verify the primary shopping actions throughout.

### 02. Explain unavailable Shop the Look combinations

**Confirmed in the local browser.** Outfit eligibility checks option completeness. Its click handler later rejects an unavailable matched variant by returning silently. LOOK 02 with crewneck S/Ecru and a completed trouser selection enabled ADD LOOK, produced zero `/api/cart` requests, and displayed no status. [Outfit panel](../components/looks/ShopTheLookPanel.tsx#L125), [selection eligibility](../lib/looks/look-selection.ts#L17)

- Demonstrate sold-out S/Ecru, a missing combination, an excluded unavailable item, and sellable zero-stock L/Ecru.
- Validate every included matched variant before enabling the action. Show and announce guidance beside the affected piece.
- Complete when changing options or excluding a piece recovers the outfit. Valid additions remain atomic, and unavailable selections produce an understandable outcome.
- Route to frontend-engineer and qa-engineer.

#### Detailed behavior and verification

- **Selection feedback.** Show which included piece needs a size/color change. Keep the selected values visible so the customer can understand and recover from the unavailable combination.
- **Outfit transaction.** Recheck every included variant at activation. Define an all-or-nothing outcome for the simulated addition, retain choices after failure, and announce a single useful outcome.
- **Edge cases.** Cover an empty included set, every piece excluded, one missing selection, an unavailable combination, and a zero-stock variant explicitly marked sellable. Excluding the blocking piece should update eligibility immediately.

### 03. Contain long product content during degraded loading

**Confirmed in the local browser.** A cached wishlist title containing fifteen repetitions of `PlaceholderName` caused 2030px document width at a 320px viewport. The product refresh returned HTTP 503, keeping the saved snapshot visible. Product-card text currently has no explicit long-word wrapping treatment. [Product card](../components/catalog/ProductCard.tsx#L153), [saved-item fallback](../components/product/WishlistView.tsx#L12)

- Demonstrate long names, unbroken words, long option labels, and missing media while refresh requests fail.
- Apply wrapping and container sizing across cards, saved items, bag rows, headings, and recovery messages. Preserve readable names and usable actions.
- Complete when representative 320, 390, 768, 1024, and 1440px layouts avoid horizontal overflow. Verify 200% text enlargement and keyboard focus around expanded content.
- Route to frontend-engineer with ui-reviewer review.

#### Detailed behavior and verification

- **Content stress set.** Use an unbroken 120-character name, a multi-line editorial name, long color labels, large formatted prices, and several stacked recovery messages.
- **Layout treatment.** Allow text columns to shrink and wrap. Preserve full accessible product names if a compact visual treatment is chosen. Keep option controls, price, and remove/save actions reachable.
- **Review surfaces.** Check catalog cards, wishlist fallback cards, bag rows, search results, Quick Add, and outfit rows. Include landscape phone height and focus outlines at the viewport edge.

### 04. Maintain contrast throughout navigation hover states

**Confirmed in the browser and source.** Menu hover text rendered forest green over the black background, approximately 1.71:1 contrast. The same treatment appears in search results and homepage category links. Required text contrast is at least 4.5:1 for normal text and 3:1 for qualifying large text, including hover states. [Menu](../components/navigation/FullScreenMenu.tsx#L321), [search](../components/navigation/SearchOverlay.tsx#L326), [category links](../components/home/CategoryShowcase.tsx#L32), [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

- Demonstrate menu categories, subcategories, search categories and collections, and homepage category links.
- Choose a readable hover treatment that retains Esque’s restrained forest accent.
- Complete when text and controls meet their applicable contrast requirements in default, hover, focus, and combined states. Check intermediate transition colors and reduced motion.
- Route to ui-ux-designer and frontend-engineer.

#### Detailed behavior and verification

- **State matrix.** Measure default, hovered, keyboard-focused, selected, disabled, and combined hover/focus states on every relevant background. Include text displayed during transitions.
- **Visual direction.** Use the forest accent for a readable underline, border, or other supporting treatment where dark green text cannot carry the required contrast. Preserve visible keyboard focus independently of hover.
- **Proof artifact.** Record foreground/background values and the measured ratio for each corrected shared treatment. Add targeted assertions for the reproduced menu case and other reused treatments.

## P2 shopping and presentation improvements

### 05. Show availability in the context of selected options

**Source-confirmed enhancement.** The shared picker marks a value available when any sellable variant contains it. A size can therefore appear available while its currently chosen color is sold out. PDP and Quick Add already reject unavailable complete combinations. [Variant picker](../components/product/VariantPicker.tsx#L46), [availability helper](../lib/product/variants.ts#L58)

- Demonstrate disjoint size/color combinations and switching both options after choosing an unavailable pair.
- Communicate contextual availability and recovery while preserving freedom to change either option.
- Complete when the picker avoids trapping a selection, preserves intentional choices, and never guesses a size. Verify PDP, Quick Add, and Shop the Look together.
- Route to frontend-engineer, with commerce and accessibility review.

#### Detailed behavior and verification

- **Picker behavior.** After a color is selected, distinguish sizes sellable in that color. Explain unavailable pairs in text and keep another color reachable. Preserve an intentional size when changing color if the resulting pair remains valid.
- **Data rules.** Resolve a single variant from the complete option tuple. Use sellability consistently across price, availability, button state, bag payload, and analytics context.
- **Demo matrix.** Include disjoint pairs, an absent pair, mixed variant prices, a single sellable pair, and inventory quantity zero with continued selling enabled. Verify all three picker entrypoints.

### 06. Bring size and color touch targets into line with other controls

**Measured enhancement.** The crewneck M label measured approximately 47.0 × 37.5px at a 390px viewport. A proposed 44px touch-comfort target matches recent menu, filter, and bag controls. This item improves touch comfort and consistency. [Option labels](../components/product/VariantPicker.tsx#L65)

- Demonstrate short sizes, long color names, wrapped option rows, and disabled values.
- Complete when enabled option hit areas reach the proposed 44px comfort target without crowding adjacent choices. Check focus outlines and selected-state contrast at narrow widths.
- Route to frontend-engineer and ui-reviewer.

#### Detailed behavior and verification

- **Touch details.** Increase the actual interactive hit area and spacing while retaining the compact editorial label treatment. Check wrapped rows and adjacent actions for accidental activation.
- **Input coverage.** Use touch, mouse, and keyboard on the same fixture. Confirm selected and unavailable states remain distinguishable without relying solely on color.

### 07. Make the size-guide structure fit the garment

**Source-confirmed gap.** Every product opens the same synthetic S–XL chest/length table. Trousers therefore receive the tops-oriented demonstration chart. [Size guide](../components/product/SizeGuidePanel.tsx#L11)

- Demonstrate labeled synthetic tops and bottoms charts, a missing-chart state, and inch/centimeter switching.
- Identify body versus garment measurements and provide measurement instructions, a table caption, and appropriate row/column headers.
- Complete when the chart follows the product’s option labels and garment type. Keep every synthetic value visibly provisional and preserve existing dialog/focus behavior.
- Route to ecommerce-merchandiser for the data shape, then frontend-engineer. Final measurements remain a product-data dependency.

#### Detailed behavior and verification

- **Guide features.** Provide garment-specific measurement names, unit switching, a simple measurement illustration or instructions, and a clear indication that the values are synthetic.
- **Data contract.** Represent garment category, measurement basis, units, size labels, and optional notes separately. Keep original values as the conversion source to avoid cumulative rounding.
- **Fallback and accessibility.** When a chart is absent, retain useful fit guidance and identify the missing measurements. Ensure the table scrolls within its region, headers remain meaningful, and closing returns focus to its trigger.

### 08. Complete size, color, and collection filtering

**Documented deferred feature.** Current filters cover category routing, sort, availability, and price. Size, color, and collection remain deferred. [Filter contract](../lib/catalog/filters.ts#L38), [filter interface](../components/catalog/FilterBar.tsx#L23), [roadmap](../ROADMAP.md)

- Demonstrate fixtures with intersecting sizes, colors, stock states, and two labeled collections.
- Preserve filters and sorting in the URL, show active selections, support reset, and explain empty results. Define availability using the same matching variant.
- Complete when reload and browser Back preserve state, keyboard and touch controls remain usable, and the local data adapter applies the combined filters correctly. Validate any Shopify query changes against the public schema.
- Route to frontend-engineer and backend-engineer, coordinated by engineering-lead.

#### Detailed behavior and verification

- **Filter interactions.** Show selected values as removable chips and provide Clear all. Choose and document immediate application or an explicit Apply action for the mobile panel. Make pending and settled result counts understandable.
- **Matching rules.** Use OR within a facet and AND across facets, subject to an explicit product decision. Size/color/availability combinations must correspond to the same variant. Define price matching against the displayed purchasable variant range.
- **Navigation and recovery.** Reset pagination when matching criteria change. Preserve unrelated supported query parameters, normalize invalid values, and restore filters through Back/Forward. Empty results should offer a useful reset action.
- **Demo proof.** Filter a 30-product synthetic catalog to a known small set, remove one chip, change sort, reload, and return from a PDP. Verify expected IDs and result order at every step.

### 09. Make every matching catalog item reachable

**Source-confirmed limit.** The listing consumes the products array while discarding pagination metadata. The default request takes 24 products. Demo results always report no next page and omit cursor progression. [Catalog listing](../components/catalog/CategoryListing.tsx#L78), [Demo query results](../lib/shopify/products.ts#L557)

- Demonstrate 25–30 deterministic products, multiple pages, a filtered final page, and a failed continuation request.
- Add accessible continuation using the existing cursor contract. Preserve sort, filters, position, and history behavior.
- Complete when all matching products remain reachable without duplicates or omissions. Distinguish displayed counts from any known total and provide working Retry.
- Route to fullstack-engineer and qa-engineer.

#### Detailed behavior and verification

- **Continuation design.** Use an explicit Load more action or paginated navigation with a clear loading state, loaded count, end state, and inline retry. Choose the interaction before implementation.
- **State integrity.** Bind cursors to the active filter/sort query. Prevent duplicate continuation requests, ignore stale responses after a query change, and deduplicate product IDs defensively.
- **Focus and history.** Keep focus stable when results append and announce the added count. Define return-from-product behavior so customers can recover the previous results and reading position.
- **Boundary cases.** Exercise 0, 1, 24, 25, and 30 results, a final partial page, a repeated cursor, and a continuation error followed by recovery.

### 10. Expand the fixture catalog beyond the current happy paths

**Source-confirmed coverage limit.** Detail fixtures share a Size/Color schema and provisional information. Catalog fixtures all have media. The crewneck already covers several prices, sold-out pairs, and sellable zero stock. [Fixture definitions](../lib/shopify/preview-demo-fixtures.ts#L147)

- Add named scenarios for absent media/information, a default variant with no selectable options, one option, unknown inventory, long labels, sparse combinations, empty collections, and a larger catalog.
- Keep fixture IDs deterministic and make scenarios reachable through ordinary browsing or a documented local preview entrypoint.
- Complete when card, PDP, Quick Add, outfit, wishlist, and bag journeys handle applicable shapes consistently. Preserve the existing representative crewneck fixture and automated tests.
- Route to ecommerce-merchandiser, backend-engineer, and qa-engineer.

#### Detailed behavior and verification

- **Fixture families.** Create clearly named normal, sparse-options, long-content, missing-media, sold-out, and large-catalog scenarios. Reuse canonical products across PDP, card, outfit, wishlist, and bag.
- **Truthfulness.** Mark synthetic measurements, prices, availability, and imagery as demonstration data wherever customers could interpret them as real offers. Avoid manufactured reviews or unsupported product claims.
- **Maintainability.** Document scenario IDs and expected outcomes beside the fixtures or existing test documentation. Keep deterministic ordering and fixed inputs so screenshots and assertions remain repeatable.

### 11. Improve failed-image presentation outside the fullscreen viewer

**Source-confirmed enhancement opportunity.** The fullscreen viewer has explicit loading/error/retry behavior. Cards, the main gallery stack, bag thumbnails, and Recently Viewed use standard image rendering. Missing-image placeholders already exist in several components. Failed HTTP image requests need their own demonstration. [Product card](../components/catalog/ProductCard.tsx), [gallery stack](../components/product/ProductGallery.tsx), [bag rows](../components/cart/BagView.tsx), [viewer recovery](../components/product/ProductGalleryImage.tsx)

- Demonstrate HTTP 404, delayed decoding, and a failed responsive rendition.
- Complete when layouts reserve image space, meaningful names remain readable, and recovery or fallback is understandable. Preserve server-rendered first-image priority and responsive image quality.
- Route to frontend-engineer and seo-performance-engineer.

#### Detailed behavior and verification

- **Fallback behavior.** Keep the product name and destination available when the image fails. Reserve the intended aspect ratio and present a restrained placeholder with useful retry only where recovery is possible.
- **Request safety.** Avoid infinite retry loops and repeated failing requests on every render. Scope loading/error state to the active image so switching products or renditions resets correctly.
- **Visual proof.** Capture loaded, loading, failed, and recovered states at card, gallery, bag, and history sizes. Confirm fallback copy does not push shopping actions outside the viewport.

### 12. Demonstrate Search recovery with populated results

**Confirmed test-coverage gap.** The existing Search Retry test returns to the unconfigured-store failure. It does not establish recovery to populated results. [Search tests](../tests/e2e/search.spec.ts#L194), [overlay request handling](../components/navigation/SearchOverlay.tsx)

- Demonstrate HTTP 503 followed by success, a delayed older query followed by a newer response, and closing/reopening while a query is pending.
- Complete when current-query results retain ownership, Retry yields usable products/collections, destinations are correct, and focus remains predictable.
- Route to qa-engineer and frontend-engineer. Reuse existing product-request and gallery retry coverage where applicable.

#### Detailed behavior and verification

- **Search states.** Cover initial suggestions, typing, pending, populated results, empty results, failed request, retrying, and recovered results. Retain the query after a recoverable failure.
- **Race control.** Resolve an older request after a newer one and after the overlay closes. Confirm stale data cannot replace the current query or unexpectedly reopen the interface.
- **Usability proof.** Verify keyboard access to products and collections, accessible result counts, sensible Escape behavior, and focus restoration. Check a long query and long matching titles on mobile.

### 13. Extend bag tests to contested and interrupted updates

**Verification opportunity.** Existing tests cover duplicate activation, sequential two-tab adds, storage clearing, invalid saved selections, retry, and blocked persistence. Delayed responses crossing another tab’s update and the browser-without-Web-Locks path need targeted coverage. [Bag tests](../tests/e2e-demo/cart.spec.ts), [cart provider](../components/cart/CartProvider.tsx)

- Demonstrate a held mutation, another tab’s edit, a network disconnect, malformed JSON, unavailable Web Locks, and retry after an intervening update.
- Complete when acknowledged lines remain consistent, stale responses cannot overwrite newer saved intent, failed operations retain understandable recovery, and duplicate adds remain prevented.
- Route to qa-engineer and fullstack-engineer.

#### Detailed behavior and verification

- **Conflict policy.** Specify the expected outcome when two tabs update the same line, one removes a line during another add, or a delayed response follows a newer update. Assert the policy explicitly.
- **Interrupted mutation.** Keep acknowledged state visible while an operation fails. Retrying must account for current state and avoid accidentally applying an already acknowledged change twice.
- **Persistence contract.** Use stored variant references and validated server/fixture prices. Verify stale cached amounts cannot influence the authoritative simulated total and recovery explains discarded selections.

### 14. Refresh the website’s technical trust-page descriptions

**Source-confirmed stale copy.** Privacy still describes the retired whole-site password flow and says analytics instrumentation has yet to be added. The accessibility statement records September review timing and describes the former interactive model. Some stated announcement limits need comparison with current behavior. [Privacy draft](../app/(storefront)/legal/privacy/page.tsx#L60), [accessibility statement](../app/(storefront)/legal/accessibility/page.tsx#L31)

- Compare each technical statement with collection access, conditional analytics, browser storage, current look selection, and verified accessibility behavior.
- Complete when the descriptions reflect actual implementation and dated test evidence. Preserve draft labeling and identify unresolved business/legal facts for the owner.
- Route to brand-content-editor with engineering and security verification. Shipping rates, return windows, and legal approval remain owner dependencies.

#### Detailed behavior and verification

- **Copy inventory.** Check storage purpose, collection access, analytics gating, contact mechanism, accessibility support, and any described checkout behavior against the current implementation.
- **Professional presentation.** Use consistent draft notices and understandable customer language. Remove obsolete implementation details and clearly identify unresolved policy fields for later completion.
- **Evidence discipline.** Date accessibility verification accurately and describe tested scope. Link policy statements to maintained technical facts without claiming compliance or approvals that have not been established.

## P2 local verification and engineering improvements

### 15. Make browser-test environments deterministic

**Source-confirmed configuration gap.** The main suite describes a no-store environment, but its server environment does not explicitly pin all Demo/Shopify settings. Both suites may reuse a server already running locally. [Main browser configuration](../playwright.config.ts#L61), [Demo configuration](../playwright.demo.config.ts#L44)

- Demonstrate conflicting inherited variables and a reused server in the wrong mode.
- Complete when each suite explicitly selects its intended mode and either verifies a reused server or starts an isolated one. Keep credentials out of output and prevent unintended external store calls.
- Route to qa-engineer and devops-engineer.

#### Detailed behavior and verification

- **Mode contract.** Define explicit Demo and unconfigured startup profiles, including the values cleared from inherited environments. Verify the served mode before browser assertions run.
- **Isolation.** Use predictable separate ports or verified server identity. Ensure a stale development server cannot satisfy a production or no-store run accidentally.
- **Failure output.** Report the expected mode, observed mode, port, and remediation with environment values redacted. Terminate only processes owned by the test runner.

### 16. Keep production-browser checks repeatable

**Confirmed automation gap.** CI builds production output, while both browser configurations launch the development server. The latest optimized-build checks are recorded local runs. [CI workflow](../.github/workflows/ci.yml#L43), [validation record](./superpowers/plans/2026-11-13-storefront-readiness.md)

- Add a documented local command for a small production smoke in Demo and unconfigured modes.
- Complete when navigation, gallery, search, bag persistence, and focus work against the optimized server. Check the mode during build and startup, and manage ports/server cleanup predictably.
- Route to devops-engineer and qa-engineer. Local execution needs no hosting account.

#### Detailed behavior and verification

- **Smoke journey.** Start from the homepage, reach a product through navigation/search, inspect an image, choose a valid variant, add to the Demo bag, reload, and verify the saved line.
- **Second mode.** Run an unconfigured build with deliberate empty/error expectations. Confirm those states are readable and recoverable without reaching external integrations.
- **Repeatability.** Record build/start commands, server readiness, browser version, selected tests, and exit status. Clean up the owned server even when a check fails.

### 17. Turn performance measurements into a repeatable check

**Verification opportunity.** The readiness record includes three cold mobile samples and JavaScript/layout-shift measurements. Ongoing interaction measurements and a checked-in measurement command are still useful work. [Performance record](./superpowers/plans/2026-11-13-storefront-readiness.md#local-performance-check)

- Measure equivalent production runs with documented network, CPU, viewport, cache, and graphics settings.
- Cover route loading, initial and activated JavaScript, layout shifts, search typing, variant selection, gallery activation, and bag updates.
- Complete when results are reproducible enough to establish justified regression thresholds. Preserve important image detail and keep real-device/frame-rate claims tied to actual measurements.
- Route to seo-performance-engineer and qa-engineer.

#### Detailed behavior and verification

- **Measurement design.** Use a fixed fixture and route set, multiple cold samples, and a separate warm-navigation pass. Record median and spread alongside individual runs.
- **Interaction detail.** Measure search input responsiveness, variant-to-price update, fullscreen activation, and bag feedback under the same documented throttling. Inspect network waterfalls and JavaScript activation costs.
- **Budget decisions.** Set thresholds after establishing a repeatable baseline. Investigate material regressions with traces and compare visual quality before accepting image or animation changes.

### 18. Verify actual browser zoom and assistive-technology behavior

**Documented verification gap.** Narrow reflow, keyboard journeys, and gallery zoom have automated coverage. Actual browser magnification and screen-reader output remain unverified in the readiness record. [Readiness limitations](./superpowers/plans/2026-11-13-storefront-readiness.md), [gallery tests](../tests/e2e-demo/product-gallery.spec.ts)

- Use 200% browser/text zoom and 400% reflow with populated fixtures, long content, modal dialogs, errors, and the expanded mobile action bar.
- Start with an available local screen reader, such as Windows Narrator. Record announcements, control names, reading order, and focus restoration.
- Complete when results include browser, tool, viewport, steps, and reproducible failures. Physical phone gestures and hardware graphics need available devices, with equipment-dependent results tracked explicitly.
- Route to ui-reviewer and qa-engineer.

#### Detailed behavior and verification

- **Manual journey.** Read a PDP, choose options, open/close sizing and gallery dialogs, add to bag, edit quantity, save an item, and recover from a simulated failure using keyboard and screen reader.
- **Magnification checks.** Inspect the header, modal close controls, data tables, filter panel, and mobile purchase bar under zoom. Verify the focused element remains visible and reading order stays coherent.
- **Result record.** Capture exact tool/browser versions, zoom setting, fixture, spoken output where relevant, and reproduction steps. Track unavailable hardware checks as pending evidence.

### 19. Audit accessibility across interactive states

**Audit-coverage opportunity.** The newly reproduced hover-contrast issue escaped the existing focused browser assertions. Search also announces an atomic live results container whose verbosity needs a real screen-reader check. [Search live region](../components/navigation/SearchOverlay.tsx#L304), [browser tests](../tests/e2e-demo)

- Check contrast, accessible names, headings, landmarks, error associations, and focus clearance in default, hover, focus, loading, failure, and modal states.
- Reuse existing browser tooling for targeted regressions. Evaluate any additional test-only dependency against the project’s dependency rules.
- Complete when confirmed issues have regressions and announcements communicate useful changes without reading unnecessary content. Keep a manual record for checks automation cannot establish.
- Route to qa-engineer and ui-reviewer.

#### Detailed behavior and verification

- **State coverage.** Create a compact route-by-state matrix for navigation, search, catalog, product, outfit, saved items, and bag. Cover normal, empty, loading, failure, and recovered outcomes where applicable.
- **Announcement design.** Prefer concise status updates tied to the action. Check whether search reads an entire result container unnecessarily and whether repeated feedback is announced reliably.
- **Acceptance evidence.** Combine automated semantic/contrast regressions with keyboard and screen-reader observations. Link each confirmed defect to the scenario that catches it.

### 20. Verify analytics through local UI interactions

**Confirmed coverage gap.** Current adapter tests mock the external sender and run without a browser window. Browser-level event counts and payloads need their own local verification. [Analytics adapter](../lib/analytics/gtag.ts#L35), [adapter tests](../lib/analytics/gtag.test.ts)

- Use a local capture sink or a dummy configuration with all external requests intercepted.
- Complete when settled search, result counts, variant context, wishlist additions, and repeated activation produce intentional events. Verify that simulated bag actions retain their documented analytics semantics and exclude personal or sensitive information.
- Route to data-analytics-engineer and qa-engineer. A GA4 account is unnecessary for this contract check.

#### Detailed behavior and verification

- **Event contract.** For each covered interaction, list trigger timing, permitted properties, deduplication behavior, and whether the event describes simulated commerce.
- **Privacy cases.** Use synthetic data and assert that email, access codes, tokens, free-text personal content, and full sensitive URLs never enter captured payloads.
- **Browser proof.** Capture a search followed by a result click, a variant change, a saved-item action, and a Demo bag operation. Check failure/retry and repeated activation against the intended counts.

### 21. Test the actual Shopify client transport with synthetic responses

**Confirmed coverage gap.** Product/collection tests replace `client.request`. Client tests establish configuration and client creation. The configured SDK’s HTTP boundary can be exercised locally. [Product tests](../lib/shopify/products.test.ts), [collection tests](../lib/shopify/collections.test.ts), [client tests](../lib/shopify/client.test.ts)

- Intercept every outbound request and return success, GraphQL errors, HTTP failures, invalid JSON, and missing optional fields.
- Complete when variables, API version, normalized data, and safe errors match the intended contract. Ensure no request escapes the test transport.
- Route to backend-engineer and qa-engineer. Real store permissions and final catalog behavior remain integration checks.

#### Detailed behavior and verification

- **Transport cases.** Exercise HTTP success with GraphQL errors, throttling, server failure, invalid JSON, partial optional fields, and request cancellation where supported.
- **Contract assertions.** Check operation variables and normalized product/variant identities, price currency/amount, availability, image metadata, and pagination. Ensure failures produce deliberate safe errors.
- **Scope boundary.** Local mocks establish application handling of an agreed response shape. Keep actual store permissions, live catalog fields, and platform delivery as later integration evidence.

### 22. Preview Request Access outcomes locally

**Enhancement proposal.** The form and server action exist, while successful delivery depends on the email integration. A controlled local demonstration can exercise success and failure before an account is connected. [Access page](../app/(storefront)/access/page.tsx), [submission action](../app/(storefront)/access/actions.ts)

- Demonstrate validation errors, pending submission, simulated success, service failure, retry, and repeated submission using synthetic contact data.
- Complete when the Demo outcome is clearly identified, keyboard focus and consent remain usable, and no real subscription or email is sent by the local harness.
- Route to fullstack-engineer, brand-content-editor, and qa-engineer. Actual subscription and email delivery remain external integration work.

#### Detailed behavior and verification

- **Form interaction.** Associate errors with fields, retain safe input after a service failure, expose pending state, prevent duplicate activation, and move focus to the useful outcome or first invalid field.
- **Synthetic scenarios.** Use a clearly labeled local submission handler with success, already-requested, validation-error, slow-response, and unavailable-service outcomes. Include consent changes during pending submission.
- **Delivery boundary.** Distinguish local acknowledgement from actual mailing-list enrollment. Confirm synthetic submissions generate no external messages or stored real contact records.

#### Further source findings for Request Access

- The success screen says ACCESS SENT and CHECK YOUR EMAIL, while the server action only submits a subscription job. Define acknowledgement wording that matches the completed operation. A local mocked success can verify wording without claiming actual access-code delivery. [Success screen](../app/(storefront)/access/RequestAccessForm.tsx#L36), [subscription operation](../lib/klaviyo/subscribe.ts#L20)
- First name is required and validated, but the subscription call receives only email. Decide whether that field serves an actual supported purpose. Reduce form effort or implement its deliberate data contract, with appropriate privacy wording. [Current validation](../app/(storefront)/access/actions.ts), [subscription input](../lib/klaviyo/subscribe.ts#L20)
- During pending submission the button keeps REQUEST ACCESS as its label. Evaluate a concise submitting status and busy semantics so a slow response has an understandable outcome. Combine this with the existing local failure/retry scenario. [Submit control](../app/(storefront)/access/RequestAccessForm.tsx#L138)

## P3 design and resilience proposals

### 23. Make placeholder imagery more coherent for design review

**Design proposal grounded in current fixtures.** The crewneck gallery deliberately uses illustrative stock photos from different products. The roadmap also records placeholder silhouette limitations in the closet. [Demo imagery](../lib/shopify/preview-demo-fixtures.ts#L49), [closet limitations](../ROADMAP.md#current-status-updated-2026-11-12)

- Build a coherent synthetic gallery using one licensed garment image and labeled detail crops. Keep mixed-image stress scenarios available separately.
- Explore category-appropriate placeholder silhouettes for the closet using local assets or geometry.
- Complete when image crops, gallery order, zoom, cards, and editorial spacing can be judged together. Label synthetic media and retain asset provenance. Final photography and garment models remain owner assets.
- Route to ui-ux-designer, frontend-engineer, and ecommerce-merchandiser.

#### Detailed behavior and verification

- **Asset set.** Prepare consistent front, back, fabric-detail, and fit-reference views where suitable synthetic assets exist. Maintain a shared crop/background direction across catalog, PDP, outfit, and saved items.
- **Editorial polish.** Review whitespace, type hierarchy, product-name wrapping, image alignment, and loading placeholders together at all four device tiers. Ensure the product remains the strongest visual focus.
- **Provenance.** Record the source/license or generation provenance and any synthetic labeling requirement. Avoid suggesting that a placeholder depicts the final garment or its actual material properties.

### 24. Investigate resilience when JavaScript is delayed or unavailable

**Recorded framework limitation.** The product response contains server-rendered images and links inside a streamed boundary. Existing validation found that the route’s content stays hidden until JavaScript reveals it. [Server-markup test](../tests/e2e-demo/product-gallery.spec.ts#L103), [readiness record](./superpowers/plans/2026-11-13-storefront-readiness.md#implementation-and-review-record), [root layout](../app/layout.tsx)

- Demonstrate disabled JavaScript, failed script loading, and slow hydration using local fixtures.
- Investigate supported framework/rendering approaches that keep product information and navigation readable. Explain scripting requirements for interactive enhancements where necessary.
- Complete an architecture decision and browser proof before changing streaming behavior. Preserve first-image performance, route errors, and normal client navigation.
- Route to engineering-lead and frontend-engineer, with architecture-reviewer review.

#### Detailed behavior and verification

- **Investigation stages.** First capture current script-disabled and slow-hydration behavior. Then test the smallest supported rendering change in an isolated proof and compare normal navigation, errors, and performance.
- **Minimum useful content.** Evaluate product title, price context, media, descriptive information, and ordinary navigation for readability while enhancement scripts are delayed. Document which shopping actions depend on JavaScript.
- **Decision outcome.** Record the supported approach, tradeoffs, measured evidence, and remaining limitations before broad changes to route streaming or loading boundaries.

### 25. Evaluate a local Content Security Policy

**Documented deferred work.** A sitewide Content Security Policy remains an explicit follow-up. Its asset and script compatibility can be explored against local fixtures. [Roadmap engineering items](../ROADMAP.md), [current configuration](../next.config.ts)

- Inventory required script, style, font, image, connection, and 3D-model sources. Exercise a local report-only policy and controlled integration responses.
- Complete when violations are understood and a proposed policy passes production-mode journeys, including gallery media and the graphics fallback. Keep enforcement changes tied to compatibility evidence.
- Route to security-engineer, devops-engineer, and frontend-engineer.

#### Detailed behavior and verification

- **Policy inventory.** Map each required origin to a concrete feature and environment. Include optimized images, fonts, framework scripts/styles, analytics gating, API calls, and local graphics assets.
- **Compatibility run.** Observe report-only violations across production-mode navigation, dialogs, gallery, search, bag, and graphics fallback. Distinguish expected sources from accidental dependencies.
- **Security acceptance.** Review proposed directives and any nonce/hash strategy with the security specialist. Redact sensitive report fields and verify that useful error recovery survives the proposed policy.

## Additional website holes found in the follow-up audit

Reviewed on November 14, 2026 against website revision `d6cf965`, with documentation baseline `f7e519c`. These findings extend the original 25 items. Parent browser checks used the same local production Demo server, Chromium 151.0.7922.34, reduced motion, and fresh contexts at 390 × 844px or 320 × 800px. The discovery reviewer used default motion at 390 × 844px for Search and 1440 × 900px for empty-category sorting. Source-confirmed items still require their listed browser or transport demonstration. Priorities are proposed.

### 26. Bound stalled bag operations and lock waits

**P1.** Source-confirmed reliability gap. The bag awaits fetch and response decoding while holding its origin-wide Web Lock. There is no request deadline or lock-wait cancellation, so an unresolved response can keep global pending active and queue another tab indefinitely. [Source](../components/cart/CartProvider.tsx#L73)

- **Customer impact.** A stalled operation can make the bag and other buying actions remain busy across tabs.
- **Demonstration.** Hold the local /api/cart response, then try another mutation and a second tab. Keep this distinct from an ordinary rejected request, which already has recovery.
- **Improvement.** Introduce deliberate request and lock-wait limits, cancellation, understandable timeout feedback, and retry that reconciles current state. Release owned resources on every completion path.
- **Complete when.** The held request reaches a recoverable outcome within the chosen limit, subsequent actions and the second tab recover, and a late response cannot overwrite newer acknowledged intent.
- **Owner.** fullstack-engineer and qa-engineer.

### 27. Refresh saved products independently

**P2.** Source-confirmed gap. WishlistView applies refreshed results after Promise.all settles. A single unresolved product request prevents already completed product results from updating the list. [Source](../components/product/WishlistView.tsx#L46)

- **Customer impact.** Fresh information for healthy items is held back by one unhealthy request.
- **Demonstration.** Save three pieces, return fresh price/stock for two, and hold the third response. Repeat while Retry is active.
- **Improvement.** Publish independent results as they settle, bound requests, and communicate freshness/recovery per affected item. Preserve the stable saved order and usable cached content.
- **Complete when.** The two completed items refresh promptly, the held item receives a recoverable state, and removing an item or leaving the route cancels obsolete work.
- **Owner.** frontend-engineer and qa-engineer.

### 28. Remove dead-end buying actions from known missing saved products

**P2.** Browser-confirmed at 390 × 844px. Returning product:null for a saved crewneck displays No longer available together with an enabled QUICK ADD. The synthetic fallback declares availableForSale:true even when absence is confirmed. [Source](../components/product/WishlistView.tsx#L154)

- **Customer impact.** The interface invites a buying action immediately after explaining that the piece is unavailable.
- **Demonstration.** Seed a valid v1 saved crewneck and intercept its product endpoint with {product:null}. Compare a confirmed absence, HTTP 503, and a live sold-out response.
- **Improvement.** Represent missing, stale/unknown, and live inventory as distinct states. Keep the saved title and removal control, explain availability, and offer a useful discovery destination.
- **Complete when.** A confirmed missing item has no active purchase path. A transient refresh failure retains useful recovery and a live sold-out item reflects its actual state.
- **Owner.** frontend-engineer and ui-reviewer.

### 29. Keep optional recommendations from taking down a valid PDP

**P2.** Source-confirmed failure coupling. ProductPage awaits the same-type product query before returning the valid main product. A failed recommendation query can therefore reach the page error boundary after product detail retrieval succeeded. [Source](../app/(storefront)/products/[handle]/page.tsx#L43)

- **Customer impact.** An optional discovery section can prevent the primary shopping task.
- **Demonstration.** Return a valid product detail and fail or delay only the related-product query through a controlled transport.
- **Improvement.** Isolate optional recommendation loading and errors from the main product. Preserve observable diagnostics and provide a deliberate section fallback when needed.
- **Complete when.** Title, information, images, options, and primary shopping actions remain usable through recommendation failure or delay, with no hidden discarded error.
- **Owner.** fullstack-engineer and seo-performance-engineer.

### 30. Preserve selected variants through product links

**P2.** Source-confirmed enhancement. PDP selection initializes from option defaults, while bag product links carry only the handle. Reloading or returning from a bag line loses the line’s size/color context. [Source](../components/cart/BagView.tsx#L32)

- **Customer impact.** Customers must reconstruct a choice they already made.
- **Demonstration.** Choose a non-default variant, add it, follow its bag product link, reload, and copy/open the URL in a fresh tab.
- **Improvement.** Define a validated variant URL contract and initialize only explicitly supplied valid choices. Synchronize intentional changes with history without forcing an unsolicited size selection.
- **Complete when.** Bag-to-PDP, copied URLs, reload, and Back/Forward recover the intended valid variant. Invalid or foreign IDs fall back safely with understandable guidance.
- **Owner.** frontend-engineer and backend-engineer.

### 31. Handle products with more than 100 variants

**P2.** Source-confirmed data completeness gap. Product and look queries request variants(first:100) without continuation metadata. A valid combination beyond that boundary can be absent from local matching while its option values are still displayed. [Source](../lib/shopify/queries/products.ts#L51)

- **Customer impact.** A valid product choice can appear impossible because its data was omitted.
- **Demonstration.** Create a synthetic response containing a sellable 101st variant and verify its full size/color tuple through PDP, Quick Add, and outfit selection.
- **Improvement.** Fetch complete variant data or resolve selected variants through an explicit completeness-aware contract. Apply the same solution to the look query.
- **Complete when.** The 101st valid combination is reachable and correctly priced/sellable. Truncated data never silently determines overall stock or combination validity.
- **Owner.** backend-engineer and ecommerce-merchandiser.

### 32. Close Search when selecting the current product

**P2.** Browser-confirmed by the discovery reviewer at 390 × 844px. On the crewneck PDP, search for crewneck and activate that same product. The URL stays the same and the Search dialog remains visible because pathname-based closing never fires. [Source](../components/navigation/SearchOverlay.tsx#L107)

- **Customer impact.** A result activation appears to do nothing.
- **Demonstration.** Open Search on /products/preview-featherweight-crewneck, type crewneck, and select its result. Repeat with keyboard activation.
- **Improvement.** Close Search on ordinary product-result navigation, including a destination already open. Preserve modified-click/new-tab behavior and independent Quick Add actions.
- **Complete when.** Normal activation reveals the intended PDP and leaves focus coherent for both same-page and different-page results.
- **Owner.** frontend-engineer and qa-engineer.

### 33. Provide visible product hierarchy and a way back to discovery

**P2.** Browser-confirmed enhancement at 390 × 844px. The crewneck main content links to gallery images and policies, with no category trail. The route already computes breadcrumbs for JSON-LD but does not render them as navigation. [Source](../app/(storefront)/products/[handle]/page.tsx#L54)

- **Customer impact.** Direct-entry shoppers lack an obvious route into the relevant category.
- **Demonstration.** Enter a PDP directly, then try to browse the same garment category using only its visible main content. Compare arrival from a filtered listing.
- **Improvement.** Render a restrained accessible breadcrumb from the existing known taxonomy. Where useful, support a validated return-to-results context that preserves filters and position.
- **Complete when.** Direct visitors can reach the real category, unknown taxonomy degrades gracefully, and return navigation preserves the supported browsing context.
- **Owner.** ui-ux-designer and frontend-engineer.

### 34. Make contact-page promises match available support

**P2.** Browser-confirmed at 320 and 390px. Contact states support is available by email and promises replies while its address is only ESQUE PLACEHOLDER — SUPPORT EMAIL. There is no usable contact destination in this state. [Source](../app/(storefront)/contact/page.tsx#L43)

- **Customer impact.** Customers are told support exists without a way to use it.
- **Demonstration.** Open /contact with the support email unconfigured, then preview a synthetic configured address without sending mail.
- **Improvement.** Make introductory and response wording conditional on support availability. Provide clear preparation-state guidance and useful existing policy links without inventing an address or response SLA.
- **Complete when.** The unconfigured page accurately describes its current support state and offers useful navigation. The configured preview has a correctly labeled mailto destination.
- **Owner.** brand-content-editor and frontend-engineer.

### 35. Refresh an upcoming collection when its countdown ends

**P2.** Browser-confirmed using a controlled client clock. On /collections/collection-002, overriding Date.now to two seconds after the fixture launch yields 0D 0H 0M 0S while the obscured teaser and access-code form remain displayed. The countdown has no completion handoff. [Source](../app/(storefront)/collections/[handle]/DropCountdown.tsx#L72)

- **Customer impact.** Customers waiting for a drop can remain on a stale locked screen.
- **Demonstration.** Keep the teaser open across a synthetic launch boundary. Test a client clock ahead of and behind the authoritative server clock.
- **Improvement.** Trigger a bounded authoritative refresh when the countdown completes, show a useful checking/available state, and retain server-side release authorization. Keep an exact launch date/time and timezone available after hydration.
- **Complete when.** A genuine release becomes reachable without a manual reload, clock skew cannot unlock protected content, and repeated zero ticks cannot cause refresh loops.
- **Owner.** fullstack-engineer and qa-engineer.

### 36. Give locked collection pages a clear page heading

**P2.** Browser-confirmed on the upcoming collection at 390px. The main content has zero h1 elements because CollectionTeaser renders the collection title as a paragraph. [Source](../app/(storefront)/collections/[handle]/CollectionTeaser.tsx#L34)

- **Customer impact.** Heading navigation cannot identify the locked collection as the page topic.
- **Demonstration.** Open the locked collection and inspect its headings with keyboard/screen-reader navigation. Repeat after it becomes public.
- **Improvement.** Use a meaningful page heading while preserving the restrained title appearance and avoiding disclosure of protected collection details.
- **Complete when.** Both locked and public states expose a coherent page title and heading hierarchy.
- **Owner.** frontend-engineer and ui-reviewer.

### 37. Use product imagery in shared product previews

**P3.** Browser-confirmed enhancement. The crewneck og:image points to the generic /opengraph-image. buildPageMetadata always supplies that sitewide image and accepts no product image override. [Source](../lib/seo/metadata.ts#L59)

- **Customer impact.** Shared products lack a recognizable garment preview.
- **Demonstration.** Inspect metadata for two visually different synthetic products and one product without media.
- **Improvement.** Allow a safe product-specific social preview with meaningful alt text and retain the brand fallback for missing media. Use verified product metadata and supported image dimensions.
- **Complete when.** Distinct product URLs emit their intended preview images and absolute URLs, with a valid fallback when media is absent. A local metadata check can validate the markup before any social account is used.
- **Owner.** seo-performance-engineer and frontend-engineer.

### 38. Declare the storefront’s dark native-control appearance

**P3.** Browser-confirmed enhancement. The dark website reports computed color-scheme:normal and emits no theme-color metadata in the audited pages. Native controls and browser chrome therefore lack an explicit dark presentation contract. [Source](../app/layout.tsx)

- **Customer impact.** Platform UI can look inconsistent with the storefront and needs explicit readability checks.
- **Demonstration.** Review select menus, number controls, scrollbars, autofill, and browser chrome under light/dark system settings and forced colors.
- **Improvement.** Declare the appropriate color scheme and browser theme color, then verify platform controls and autofill remain readable. Preserve system accessibility overrides.
- **Complete when.** Supported browser controls suit the dark surface, focus remains visible, and forced-color/high-contrast rendering remains usable.
- **Owner.** frontend-engineer and ui-reviewer.

### 39. Avoid surprise focus and mobile keyboard activation on Request Access

**P2.** Browser-confirmed focus behavior at 390 × 844px. Direct navigation to /access immediately focuses firstName because the field has unconditional autoFocus. A physical phone keyboard was not observed in this headless check. [Source](../app/(storefront)/access/RequestAccessForm.tsx#L81)

- **Customer impact.** The first input takes attention before the customer chooses to begin.
- **Demonstration.** Navigate directly and through the Request Access link on desktop and a real phone when available. Check whether the introduction and consent context remain easy to discover.
- **Improvement.** Evaluate focus according to entry intent and input capability. Keep initial page reading predictable, while explicitly focusing the first invalid field after submission.
- **Complete when.** Initial mobile entry preserves useful context and the agreed keyboard behavior. Validation and subsequent keyboard navigation retain clear focus.
- **Owner.** ui-ux-designer and frontend-engineer.

### 40. Connect selected color to relevant product media

**P3.** Source-confirmed enhancement proposal. The normalized variant carries selected options and price but no image/media relationship. Selecting another color cannot communicate which gallery images depict that color. [Source](../lib/shopify/products.ts#L44)

- **Customer impact.** A color choice can leave customers uncertain which appearance they are viewing.
- **Demonstration.** Use one synthetic product with distinct Black/Ecru images, shared detail views, and a variant with no dedicated media.
- **Improvement.** Define a variant-to-media association and an intentional gallery update rule. Retain the customer’s manual browsing intent and a sensible product-level fallback.
- **Complete when.** Selected color, displayed media, image alt text, and fullscreen navigation stay coherent without unexpected focus jumps. Missing mappings use the documented fallback.
- **Owner.** ecommerce-merchandiser and frontend-engineer.

### 41. Exercise dynamic sitemap coverage with synthetic catalogs

**P2.** Source-confirmed SEO gap. app/sitemap.ts returns static paths only, so product and individual collection/archive detail routes remain absent. The file describes live store access as the blocker, while enumeration and failure handling can be prepared using local response fixtures. [Source](../app/sitemap.ts#L39)

- **Customer impact.** Indexable detail pages lack sitemap discovery coverage.
- **Demonstration.** Generate entries for a synthetic catalog containing current, upcoming, archived, and missing records. Include a second page of handles.
- **Improvement.** Build and locally validate an enumeration contract that follows existing visibility decisions. Use trustworthy modification dates where available and define partial-fetch failure behavior.
- **Complete when.** Eligible product/collection routes have deduplicated absolute entries, protected destinations follow the agreed indexing rules, and lastModified reflects meaningful source data when supplied. Live store completeness remains a later integration check.
- **Owner.** seo-performance-engineer and backend-engineer.

### 42. Keep empty-category guidance accurate when sorting changes

**P2.** Browser-confirmed by the discovery reviewer at 1440 × 900px. /tops/hoodies shows NOTHING HERE YET, while /tops/hoodies?sort=newest shows NOTHING MATCHES and CLEAR FILTERS. hasActiveFilters counts ordering as a narrowing filter. [Source](../lib/catalog/filters.ts#L130)

- **Customer impact.** Sorting cannot create products in an empty category, so Clear filters suggests an ineffective recovery.
- **Demonstration.** Visit the two URLs, then compare a populated category narrowed to zero by a real price or availability filter.
- **Improvement.** Distinguish ordering from membership restrictions when selecting empty-state copy and reset actions.
- **Complete when.** A genuinely empty category retains accurate guidance across sort choices, while restrictive filters still offer a working reset.
- **Owner.** frontend-engineer and qa-engineer.

### 43. Restore keyboard focus after the closet panel closes

**P2.** Source-confirmed. Escape explicitly restores focus to the selected garment button. The panel CLOSE callback only dismisses selection, unmounting its currently focused control. [Source](../components/home/closet/ClosetExperience.tsx#L41)

- **Customer impact.** A keyboard shopper can lose their position when the focused CLOSE button disappears.
- **Demonstration.** With a graphics-capable browser, select a garment by keyboard, reach CLOSE, activate it, and inspect document.activeElement.
- **Improvement.** Unify deliberate focus restoration for the panel close paths. Return to the corresponding reachable garment trigger and handle a removed product safely.
- **Complete when.** CLOSE and Escape both leave focus at the intended garment control, with subsequent Tab order predictable. Pointer dismissal also follows an intentional focus policy.
- **Owner.** frontend-engineer and ui-reviewer.

### 44. Let visitors pause automatic closet movement

**P2.** Source-confirmed enhancement. ClosetScene applies ongoing sway and selected-garment auto-rotation, which resumes after manual input. The available interface has no persistent pause control. Reduced motion already suppresses these effects. [Source](../components/home/closet/ClosetScene.tsx#L229)

- **Customer impact.** Visitors who want a stationary view must depend on their system preference or repeatedly intervene.
- **Demonstration.** Observe ambient movement and a selected garment beyond the auto-rotation delay in a graphics-capable browser.
- **Improvement.** Provide an accessible pause/resume choice for ongoing automatic movement while preserving manual rotation and product selection.
- **Complete when.** Paused state stops ambient sway and automatic rotation, survives selection changes within the visit, and has a clear keyboard-accessible label and state. Graphics behavior remains pending direct verification.
- **Owner.** ui-ux-designer and frontend-engineer.

### 45. Respond to reduced-motion changes during the visit

**P2.** Source-confirmed. ClosetExperience initializes its preference once through useState and has no media-query change subscription. JavaScript motion can retain the previous preference until remount. [Source](../components/home/closet/ClosetExperience.tsx#L32)

- **Customer impact.** Turning on reduced motion while the homepage is open may leave automatic graphics motion active.
- **Demonstration.** Toggle the browser emulated preference in both directions while a garment is selected, then verify the graphics on a capable renderer.
- **Improvement.** Subscribe to preference changes, clean up the listener, and update all JavaScript motion consumers. Coordinate this with the explicit pause choice in item 44.
- **Complete when.** Enabling reduced motion stops the relevant effects during the same visit. Disabling it follows the agreed pause/resume policy and preserves selection and focus.
- **Owner.** frontend-engineer and ui-reviewer.

### 46. Use one visible search-query length contract

**P3.** Source-confirmed. Search input accepts unrestricted text, local category matching and analytics use the full trimmed value, while the API truncates product/collection search to 100 characters. [Source](../app/api/search/route.ts#L26)

- **Customer impact.** Customers can see a query that differs from the text actually searched, and event context can describe a different request.
- **Demonstration.** Paste queries of 99, 100, and 101 characters and a long unbroken string. Compare displayed query, local matching, transport, and captured local event context.
- **Improvement.** Define a shared supported length and normalization rule. Communicate the limit accessibly and apply it consistently without unexpected truncation during input composition.
- **Complete when.** UI, local matching, transport, and allowed analytics properties represent the same intended query, including pasted and composed input.
- **Owner.** frontend-engineer and data-analytics-engineer.

## Additional findings from revision 412476b

These items describe open work found after the original implementation pass. Each demonstration can use placeholder products, browser interception or synthetic SDK responses.

### 47. Keep filter controls synchronized after URL navigation

**P2. Browser confirmed.** Open `/new?size=M`, remove the Size M chip, then inspect the size checkbox. The URL loses `size`, while M remains checked. Activating Apply reintroduces `size=M`. The form uses `defaultChecked` and `defaultValue` on controls retained through client navigation. [Facet controls](../components/catalog/FilterBar.tsx#L118), [price fields](../components/catalog/FilterBar.tsx#L147)

- **Customer impact.** A removed choice can return unexpectedly, and the visible form can disagree with the results and active-filter chips.
- **Local demonstration.** Repeat chip removal and Clear Filters with size, color, availability and both price fields. Exercise sort links and browser Back/Forward after editing an unapplied control.
- **Improvement.** Define how applied URL state and unapplied form edits interact. Synchronize the controls after committed navigation while preserving intentional edits during the current form session.
- **Complete when.** Removed filters stay removed on the next Apply, all controls reflect the agreed URL state after navigation, and GET submission still works without JavaScript.
- **Owner.** frontend-engineer and qa-engineer. Extend item 08's existing URL contract with this reproduced regression.

### 48. Recover from stalled Search and Quick Add requests

**P2. Search browser confirmed, shared source gap confirmed.** Holding `/api/search` pending left the overlay at Searching… after 12 seconds with no Retry control. Search and Quick Add abort when their effect is cleaned up, but neither sets a deadline for a request that remains current. The SDK's upstream timeout does not bound a stalled browser-to-site response. [Search request](../components/navigation/SearchOverlay.tsx#L214), [Quick Add request](../components/product/QuickAddPanel.tsx#L80)

- **Customer impact.** An open shopping flow can remain in its loading state until the visitor changes the query or closes it.
- **Local demonstration.** Hold response headers and, separately, the JSON body. Test Search and Quick Add, retry after the agreed deadline, and close or navigate while the operation is pending.
- **Improvement.** Bound the complete client operation, expose an understandable recovery state, and distinguish a deliberate close from a timed-out request. Reuse the established cancellation approach where its behavior fits.
- **Complete when.** Each current request reaches a useful outcome within its documented budget, Retry works, and late completion cannot replace the retried result. Verify headers, decoding and transport interruption separately.
- **Owner.** frontend-engineer and qa-engineer. Item 26's bag deadline remains a separate implemented contract.

### 49. Ignore late Quick Add success from an earlier opening

**P2. Browser confirmed with an injected delayed decoder.** The first product request received a real Demo response, while its JSON promise was held beyond cancellation. After closing and reopening Quick Add, selecting M worked. Releasing the old response changed M from checked to unchecked. The success callback resets selections without checking whether its controller was aborted. [Product success callback](../components/product/QuickAddPanel.tsx#L88)

- **Customer impact.** Old responses can erase a customer's current choices or replace fresher availability while the same panel is open again.
- **Local demonstration.** Acknowledge request A and delay its decoder. Close, reopen, complete request B, select options, then release A. Repeat with retry and with changed synthetic inventory.
- **Improvement.** Associate success, failure and selection initialization with the current request and panel session. Reject stale completion even when decoding ignores cancellation.
- **Complete when.** The newer product, selections and purchase state remain intact after any older completion. Ordinary close/reopen behavior and keyboard focus continue to work.
- **Owner.** frontend-engineer and qa-engineer.

### 50. Continue the collection and archive indexes beyond 20 entries

**P2. Source confirmed.** `/collections` consumes only `getCollections()`'s first page, whose default size is 20. The archive helper filters that same first page before discarding its continuation metadata. An archived collection on a later page can therefore be absent from the archive index, even when its detail route exists. [Collections index](../app/(storefront)/collections/CollectionsIndex.tsx#L36), [archive query](../lib/archive/collections.ts#L33), [collection page contract](../lib/shopify/collections.ts#L111)

- **Customer impact.** Older or later-listed collections become undiscoverable through their indexes. A first page containing no archived collections can produce an empty-archive message despite later archived entries.
- **Local demonstration.** Supply 21 and 45 synthetic collections, including an archived entry only on page two, mixed lifecycle phases and an intermediate page containing no archived entries.
- **Improvement.** Preserve collection-level continuation and provide accessible navigation or another bounded discovery strategy. Filtering for archive membership must account for later source pages.
- **Complete when.** Every eligible collection is reachable exactly once, empty messages reflect the searched scope, and continuation handles retry, repeated cursors and keyboard navigation. Preserve upcoming-drop access rules.
- **Owner.** backend-engineer, frontend-engineer and qa-engineer. Item 09's product continuation does not cover collection-index pagination.

### 51. Scale saved-item refreshes to larger lists

**P2. Browser confirmed with synthetic data.** A valid local list of 100 entries generated 100 product requests on opening `/wishlist`. Removing one entry generated another 99 requests, for 199 total. The list has no entry bound, and its effect creates a controller and refresh promise for every item whenever `items` changes. [Refresh effect](../components/product/WishlistView.tsx#L43), [effect dependencies](../components/product/WishlistView.tsx#L114), [stored-list parsing](../lib/product/wishlist.ts#L130)

- **Customer impact.** Larger saved lists cause request bursts, repeated loading announcements and unnecessary work after a simple removal. A service limit can turn that extra work into visible availability failures.
- **Local demonstration.** Seed 1, 30, 100 and 500 valid entries. Count requested handles and concurrent work on initial load, one removal, an addition and retry of a single failure. Test slow and missing entries together.
- **Improvement.** Bound concurrent work, retain still-valid results and refresh the affected handles. Define a supported list-size policy if needed while preserving existing saved records deliberately.
- **Complete when.** Removing one item does not refetch every healthy survivor, retry targets the intended scope, and a documented concurrency budget holds. All saved entries remain reachable and independently recoverable.
- **Owner.** frontend-engineer, backend-engineer and qa-engineer. Preserve item 27's independent-result behavior.

### 52. Tolerate malformed analytics-cookie encoding

**P2. Browser and parser confirmed.** With the synthetic cookie `esque_drop_access_event=%E0%A4%A`, the actual parser throws `URIError`. Loading `/new` in an isolated context produced that page error and the heading This page couldn’t load. The shell invokes `decodeURIComponent` during its mount effect without handling invalid encoding. [Cookie parser](../lib/access/cookies.ts#L91), [shell consumer](../components/navigation/ShellClient.tsx#L51)

- **Customer impact.** A malformed optional measurement signal can interrupt the main storefront.
- **Local demonstration.** Seed invalid percent encodings, empty values, valid encoded Unicode and an ordinary valid handle in separate browser contexts. No real access credential is required.
- **Improvement.** Treat malformed analytics signals as invalid input and keep the storefront usable. Define deliberate clearing behavior so the same bad signal is not repeatedly processed.
- **Complete when.** Invalid cookie values cause no uncaught errors or broken storefront, valid handles still produce their intended event, and the actual collection-access decision retains its server-side authority.
- **Owner.** frontend-engineer, security-engineer and qa-engineer. This finding concerns the optional analytics signal.

### 53. Consume drop-granted signals during client navigation

**P2. Signal-lifecycle browser reproduction.** After the shell mounted, a synthetic valid grant signal was added and a normal client link opened `/bag`. No `drop_access_granted` event fired and the signal remained. Reloading consumed the same signal and emitted one event. The consumer effect runs only on shell mount. [Grant consumer](../components/navigation/ShellClient.tsx#L51), [grant-producing action](../app/(storefront)/collections/[handle]/actions.ts)

- **Customer impact.** Successful access can be absent from the access funnel or attributed to a later reload. The customer's actual collection access is a separate server decision.
- **Local demonstration.** Deliver a local synthetic grant during an already-mounted session, exercise the equivalent client-navigation lifecycle, and verify local event capture. Also cover a signal present on first load and repeated navigation after consumption.
- **Improvement.** Observe the actual successful grant transition, emit once for that grant and clear the signal at the appropriate point. Preserve existing public browsing behavior.
- **Complete when.** Initial-load and in-session grants each produce exactly one intended event. Ordinary navigation and reload do not duplicate an already-consumed grant. A real account connection is unnecessary for the local contract test.
- **Owner.** frontend-engineer, data-analytics-engineer and qa-engineer. The browser probe covered the signal lifecycle; a mocked successful action should complete the integration regression.

### 54. Return keyboard focus to useful recovery after a service failure

**P2. Browser confirmed in Demo Request Access.** Submit a valid synthetic email and consent using Enter with Preview outcome set to Service unavailable. The error appears, but `document.activeElement` is BODY and there is no invalid field. The focus effect only finds an invalid field for errors. The submitting button is disabled during the operation. [Focus handling](../app/(storefront)/access/RequestAccessForm.tsx#L35), [submit control](../app/(storefront)/access/RequestAccessForm.tsx#L165)

- **Customer impact.** Keyboard users lose their place when a service error needs a retry, despite their entered email and consent being retained.
- **Local demonstration.** Submit by keyboard, return a delayed service failure, inspect focus and the next Tab destination, then retry successfully. Also test when the visitor deliberately moves focus while waiting.
- **Improvement.** Define recovery focus for a form-level error. Move focus to the useful error or retry target when appropriate, while respecting deliberate navigation during the request.
- **Complete when.** Failed submission leaves a clear announcement and reachable recovery target, safe input remains, field errors focus their field, and success retains its useful outcome focus.
- **Owner.** frontend-engineer, ui-reviewer and qa-engineer. Extend item 22's service-failure verification with this exact keyboard regression.

### 55. Include selected quantity in purchase-intent analytics

**P2. Source-confirmed information gap.** The PDP resolves the selected quantity for `cart.addItems`, while the preceding `add_to_bag_click` payload carries the unit price and no quantity. The analytics item type has no quantity property. Intent for three units is therefore indistinguishable from intent for one unit in that payload. [Intent and cart call](../components/product/ProductPurchasePanel.tsx#L238), [analytics item contract](../lib/analytics/events.ts#L31)

- **Customer and business impact.** Local funnel evidence cannot verify the quantity the shopper chose, and later reporting can confuse unit price with the intended line value.
- **Local demonstration.** Select a synthetic $128 variant with quantities 1 and 3. Capture the existing intent event and compare it with the actual Demo mutation, including quantity normalization.
- **Improvement.** Document unit price, normalized quantity and intent-value semantics. Extend the typed event contract and its local verification together. Preserve the established distinction between intent and commerce success.
- **Complete when.** Captured quantity matches the committed intent, unit price remains explicit, value follows the documented rule, and retry does not create unintended duplicate attribution.
- **Owner.** data-analytics-engineer, frontend-engineer and qa-engineer.

### 56. Provide Undo for accidental saved-item removal

**P3. Enhancement proposal.** Removing an item immediately updates the local list and announces removal. There is no Undo control in that flow. [Removal handler](../components/product/WishlistView.tsx#L116), [storage mutation](../lib/product/wishlist.ts#L193)

- **Customer impact.** An accidental activation requires finding and saving the piece again, which is harder for a long title or a temporarily unavailable product.
- **Local demonstration.** Remove a healthy piece, the final saved piece and a known missing piece. Exercise keyboard removal and blocked storage.
- **Improvement.** Offer a concise, accessible Undo action with a documented lifetime and safe restoration behavior. Preserve the snapshot needed to restore a missing piece.
- **Complete when.** Undo restores the right entry once, handles an entry independently re-added or removed elsewhere, works during session-only persistence, and leaves useful focus after the final-item empty state.
- **Owner.** product-manager, ui-ux-designer, frontend-engineer and qa-engineer.

### 57. Make matches beyond predictive Search reachable

**P2. Source-confirmed discovery limit and enhancement proposal.** Product and collection predictive searches each default to six results. The API returns arrays without continuation metadata, and the overlay renders those arrays without a complete-results destination. Demo matching also slices at that limit. [Product search](../lib/shopify/products.ts#L661), [collection search](../lib/shopify/collections.ts#L167), [API response](../app/api/search/route.ts#L43)

- **Customer impact.** A broad query can hide relevant matches beyond the preview with no direct way to continue that query.
- **Local demonstration.** Search a synthetic term matching at least 7 and then 30 products, plus more than 6 collections. Confirm every intended match can be reached through the designed search journey.
- **Improvement.** Keep a concise predictive preview and add a deliberate full-results or continuation path. Carry the query into a validated URL, make displayed counts honest about their scope and reuse bounded catalog patterns where suitable.
- **Complete when.** Preview limits are understandable, later matches remain reachable without omissions, and query, browser history, keyboard focus and empty-result recovery work together.
- **Owner.** product-manager, frontend-engineer, backend-engineer and qa-engineer. This extends Search discovery beyond item 12's failure recovery.

### 58. Retain useful Search results when one lookup fails

**P3. Enhancement proposal requiring a documented policy decision.** The API awaits product and collection lookup with `Promise.all`. A failure in either returns the combined error state. The current route explicitly documents this all-or-nothing policy. [Combined lookup and failure](../app/api/search/route.ts#L42)

- **Customer impact.** A collection lookup failure can hide healthy product matches, and a product lookup failure can hide healthy collection matches. Local category suggestions have their own independent behavior.
- **Local demonstration.** Return successful synthetic products with a collection error, then reverse the failure. Cover an empty successful group and a stalled failed group.
- **Improvement.** Evaluate independent group states and scoped Retry while keeping genuine empty results distinguishable from failed lookups. Record any change to the existing search policy in DECISIONS.md before implementation.
- **Complete when.** Healthy results remain usable, failed groups have useful recovery, late retries cannot replace a newer query, and result-count analytics follows the displayed scope.
- **Owner.** product-manager, backend-engineer, frontend-engineer and data-analytics-engineer.

## Feature packages for a more polished demo

These packages expand the existing items into coherent website experiences. They are proposed scope for subsequent implementation. Each package can be demonstrated using synthetic products and intercepted service responses.

| Package | Features to demonstrate | Related items | Completion evidence |
| --- | --- | --- | --- |
| Find the right piece | Size/color/collection filters, removable selections, understandable counts, empty-result recovery, continued browsing | 05, 08–10, 12 | A known fixture set remains discoverable through filtering, search, reload, and browser history |
| Understand fit and details | Garment-aware size charts, unit conversion, measurement instructions, contextual availability, coherent detail imagery | 05–07, 10–11, 23 | A customer can identify a valid size/color combination and understand the provisional fit information |
| Build a complete look | Per-piece availability guidance, inclusion controls, consistent variant pricing, atomic simulated addition, recoverable failures | 02, 05, 10, 13 | One unavailable piece is explained and a corrected outfit reaches the bag with the expected variants and total |
| Resume shopping | Robust recently viewed history, readable saved-item snapshots, cross-tab bag consistency, return-to-results position | 01, 03, 09, 13 | Reload, failed refresh, and a second tab preserve understandable shopping intent |
| Shop comfortably on mobile | Comfortable option targets, wrapping, stable media space, zoom/reflow, visible focus around sticky actions | 03–04, 06, 11, 18–19 | Phone/tablet layouts and keyboard journeys remain usable with long content, errors, and magnification |
| Trust the experience | Accurate draft policies, honest Demo outcomes, restrained recovery messages, verified local event contracts | 14, 20–22 | Technical statements match implementation and synthetic interactions produce the documented local outcomes |
| Review a professional presentation | Consistent image direction, garment-appropriate placeholders, deliberate type/spacing, readable interactive states | 03–04, 11, 23 | Reviewed screenshots cover loaded, empty, pending, failed, and recovered states at the documented sizes |

### Cross-cutting interaction requirements

- Keep the initiating action and its outcome connected. Place feedback near the control and announce meaningful changes through the appropriate status mechanism.
- Preserve intentional choices through recoverable failures. Explain any invalid or discarded selection and provide a clear next action.
- Follow existing motion timing and reduced-motion rules. Check interrupted transitions, rapid repeated input, and closing an overlay while work is pending.
- Keep prices and availability aligned across card, picker, outfit, saved item, and bag for the same variant. Use canonical synthetic records for the demonstration.
- Reserve media space and maintain useful product information during slow requests. Avoid layout shifts that move an action under a pointer or obscure keyboard focus.
- Review final copy against CONTENT.md and visual behavior against DESIGN_SYSTEM.md and INTERACTIONS.md. Any example wording in this backlog remains implementation guidance pending that review.

### Suggested demonstration script

1. Browse a populated collection, filter by size/color, change sorting, and continue beyond the first page.
2. Open a product, inspect coherent images, read fit guidance, switch measurement units, and select a valid variant.
3. Try an unavailable pair, recover through the picker, and add the corrected selection to the Demo bag.
4. Build an outfit containing an unavailable piece, correct or exclude it, and add the valid included pieces.
5. Save an item, refresh with the product endpoint failing, and verify the readable cached snapshot and recovery.
6. Open another tab, edit the bag during a delayed update, and inspect the final lines and feedback in both tabs.
7. Repeat the key steps with blocked storage, keyboard navigation, reduced motion, and magnification.
8. Review local analytics captures, production performance measurements, and the dated accessibility observations for the same revision.

### Implementation handoff for each item

Record the intended customer outcome, selected fixture IDs, affected entrypoints, state transitions, data rules, owned files, dependencies, and expected validation. Reuse the existing components and contracts before adding new abstractions. Keep the change small enough for its behavior and evidence to be reviewed together.

| Work group | Prerequisites | Deliverable |
| --- | --- | --- |
| Reliability first | Reproductions 01–04 | Focused fixes and regression evidence for the four confirmed failures |
| Demo foundation | 10, 15–16 | Reachable fixture scenarios and repeatable production browser runs |
| Discovery and fit | Foundation plus 05–09, 12 | Connected filter, continuation, selection, and size-guide journeys |
| Resilience and trust | 11, 13–14, 20–22 | Recovery contracts, accurate technical copy, and local integration demonstrations |
| Inclusive presentation | 17–19, 23 | Coherent visuals with performance, keyboard, magnification, and assistive-technology evidence |
| Architecture investigations | 24–25 | Measured rendering and CSP proposals with recorded compatibility results |

The work groups can overlap when file ownership and dependencies permit. Accessibility, security, and performance review accompany relevant changes throughout the sequence.

## Execute the backlog with repeatable local demos

Work through items 01–04 first, together with the stalled-operation risk in item 26. Establish fixture scenarios and deterministic test environments before expanding filtering or pagination. Review trust-page descriptions alongside the relevant technical changes. Performance and accessibility checks should accompany each affected journey.

For each item, record the baseline revision, fixture scenario, reproduction steps, expected outcome, screenshots where relevant, validation command, and observed result. Update its status only when the implementation and applicable checks support completion. Follow AGENTS.md for role routing, review, and validated publication to `surfacebook`.

Use the existing opt-in Demo Mode for populated journeys. Set `PREVIEW_DEMO_MODE=1` during both production build and startup. Keep a separate unconfigured-mode check and synthetic data for all intercepted service responses. The current local runtime and test commands are recorded in the readiness document. [Runtime and validation commands](./superpowers/plans/2026-11-13-storefront-readiness.md#validation-record)

Final garment measurements, composition, care, photography, approved business policies, live Shopify transactions, real email delivery, account access, and hosted deployment remain owner or service dependencies. Each related item above identifies the interface or local verification that can progress beforehand.

## Follow-up audit coverage and limits

The parent inspected product, saved-item, contact, access, archive, legal, metadata, sitemap, countdown, and shared layout code. Independent UI and commerce reviewers inspected discovery/navigation/closet and shopping data/operation contracts. Their source findings were compared with the original backlog before inclusion.

Local browser checks covered contact, PDP, access, missing-page recovery, archive, collections, new arrivals, and tops at 320 or 390px. The discovery reviewer checked Search on the current PDP and empty-category sorting, including a 1440px run. The parent reproduced the known-missing wishlist action mismatch and the zero-countdown teaser with a controlled client clock. Ordinary narrow routes in this sample stayed within their viewport width.

A proposed claim that S/Ecru has no sold-out feedback was rejected after the browser displayed SOLD OUT. Contextual availability enhancements remain in item 05. This prevents a source-only suspicion from becoming a recorded defect.

Graphics motion/focus findings are based on source and still need a graphics-capable browser demonstration. Actual phone keyboard behavior, physical safe areas, screen-reader speech, live commerce, and external message delivery remain outside the evidence gathered in this pass. Browser coverage is a sampled audit of the listed journeys. Source-confirmed risks and proposed enhancements retain their evidence labels until directly verified.

## Keep this inventory current

Refresh this document after each completed group of work. Align stale roadmap and test comments with the newer Demo coverage and D-093 so future work uses the current website baseline. Re-audit after new fixtures expose additional states. The findings reflect the reviewed source and listed demonstrations, with device-dependent and unverified behavior identified explicitly.
