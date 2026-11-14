# Website improvements you can complete with demo products

Use this backlog to improve Esque’s reliability, accessibility, presentation, and shopping experience before final products and external service accounts are available. Each item includes current evidence, a local demonstration, and a completion check. Shopify is the commerce platform referenced in this document.

Reviewed on November 14, 2026 against commit `d6cf965` on `surfacebook`. All items below start open. The requested deliverable is this improvement inventory. Priorities are proposed implementation order.

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

P1 addresses reproduced failures that prevent progress or readability. P2 completes existing journeys and their verification. P3 covers scoped design or architecture proposals. Items identified through source inspection or missing test coverage say so explicitly.

## Preserve the completed shopping features

The current baseline includes gallery navigation, fullscreen image zoom, swipe handling, image retry, mobile purchase feedback, a simulated bag, wishlist recovery, and product-information sections. Their remaining gaps appear below. The earlier implementation and validation record documents their completed coverage. [Storefront readiness record](./superpowers/plans/2026-11-13-storefront-readiness.md)

## P1 fixes

### 01. Keep product pages usable when browser storage fails

**Confirmed in the local browser.** `RecentlyViewed` accesses `window.localStorage` before its helper can catch storage errors. In a fresh browser context, replacing that getter with a throwing `SecurityError` changed the crewneck page to SOMETHING WENT WRONG and Retry. The helper also accepts an array of unchecked history entries, so malformed records need defensive handling. [Recently Viewed component](../components/product/RecentlyViewed.tsx#L50), [history parser](../lib/product/recently-viewed.ts#L30)

- Demonstrate blocked storage access, quota failure, malformed JSON, null entries, invalid image URLs, and a valid older history record.
- Guard storage acquisition and validate individual records. Preserve valid history and useful in-session behavior where possible.
- Complete when the product heading, options, gallery, wishlist, and Demo bag work through each storage failure. Add focused regressions for the reproduced crash and malformed records.
- Route to frontend-engineer, with qa-engineer verification.

### 02. Explain unavailable Shop the Look combinations

**Confirmed in the local browser.** Outfit eligibility checks option completeness. Its click handler later rejects an unavailable matched variant by returning silently. LOOK 02 with crewneck S/Ecru and a completed trouser selection enabled ADD LOOK, produced zero `/api/cart` requests, and displayed no status. [Outfit panel](../components/looks/ShopTheLookPanel.tsx#L125), [selection eligibility](../lib/looks/look-selection.ts#L17)

- Demonstrate sold-out S/Ecru, a missing combination, an excluded unavailable item, and sellable zero-stock L/Ecru.
- Validate every included matched variant before enabling the action. Show and announce guidance beside the affected piece.
- Complete when changing options or excluding a piece recovers the outfit. Valid additions remain atomic, and unavailable selections produce an understandable outcome.
- Route to frontend-engineer and qa-engineer.

### 03. Contain long product content during degraded loading

**Confirmed in the local browser.** A cached wishlist title containing fifteen repetitions of `PlaceholderName` caused 2030px document width at a 320px viewport. The product refresh returned HTTP 503, keeping the saved snapshot visible. Product-card text currently has no explicit long-word wrapping treatment. [Product card](../components/catalog/ProductCard.tsx#L153), [saved-item fallback](../components/product/WishlistView.tsx#L12)

- Demonstrate long names, unbroken words, long option labels, and missing media while refresh requests fail.
- Apply wrapping and container sizing across cards, saved items, bag rows, headings, and recovery messages. Preserve readable names and usable actions.
- Complete when representative 320, 390, 768, 1024, and 1440px layouts avoid horizontal overflow. Verify 200% text enlargement and keyboard focus around expanded content.
- Route to frontend-engineer with ui-reviewer review.

### 04. Maintain contrast throughout navigation hover states

**Confirmed in the browser and source.** Menu hover text rendered forest green over the black background, approximately 1.71:1 contrast. The same treatment appears in search results and homepage category links. Required text contrast is at least 4.5:1 for normal text and 3:1 for qualifying large text, including hover states. [Menu](../components/navigation/FullScreenMenu.tsx#L321), [search](../components/navigation/SearchOverlay.tsx#L326), [category links](../components/home/CategoryShowcase.tsx#L32), [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

- Demonstrate menu categories, subcategories, search categories and collections, and homepage category links.
- Choose a readable hover treatment that retains Esque’s restrained forest accent.
- Complete when text and controls meet their applicable contrast requirements in default, hover, focus, and combined states. Check intermediate transition colors and reduced motion.
- Route to ui-ux-designer and frontend-engineer.

## P2 shopping and presentation improvements

### 05. Show availability in the context of selected options

**Source-confirmed enhancement.** The shared picker marks a value available when any sellable variant contains it. A size can therefore appear available while its currently chosen color is sold out. PDP and Quick Add already reject unavailable complete combinations. [Variant picker](../components/product/VariantPicker.tsx#L46), [availability helper](../lib/product/variants.ts#L58)

- Demonstrate disjoint size/color combinations and switching both options after choosing an unavailable pair.
- Communicate contextual availability and recovery while preserving freedom to change either option.
- Complete when the picker avoids trapping a selection, preserves intentional choices, and never guesses a size. Verify PDP, Quick Add, and Shop the Look together.
- Route to frontend-engineer, with commerce and accessibility review.

### 06. Bring size and color touch targets into line with other controls

**Measured enhancement.** The crewneck M label measured approximately 47.0 × 37.5px at a 390px viewport. A proposed 44px touch-comfort target matches recent menu, filter, and bag controls. This item improves touch comfort and consistency. [Option labels](../components/product/VariantPicker.tsx#L65)

- Demonstrate short sizes, long color names, wrapped option rows, and disabled values.
- Complete when enabled option hit areas reach the proposed 44px comfort target without crowding adjacent choices. Check focus outlines and selected-state contrast at narrow widths.
- Route to frontend-engineer and ui-reviewer.

### 07. Make the size-guide structure fit the garment

**Source-confirmed gap.** Every product opens the same synthetic S–XL chest/length table. Trousers therefore receive the tops-oriented demonstration chart. [Size guide](../components/product/SizeGuidePanel.tsx#L11)

- Demonstrate labeled synthetic tops and bottoms charts, a missing-chart state, and inch/centimeter switching.
- Identify body versus garment measurements and provide measurement instructions, a table caption, and appropriate row/column headers.
- Complete when the chart follows the product’s option labels and garment type. Keep every synthetic value visibly provisional and preserve existing dialog/focus behavior.
- Route to ecommerce-merchandiser for the data shape, then frontend-engineer. Final measurements remain a product-data dependency.

### 08. Complete size, color, and collection filtering

**Documented deferred feature.** Current filters cover category routing, sort, availability, and price. Size, color, and collection remain deferred. [Filter contract](../lib/catalog/filters.ts#L38), [filter interface](../components/catalog/FilterBar.tsx#L23), [roadmap](../ROADMAP.md)

- Demonstrate fixtures with intersecting sizes, colors, stock states, and two labeled collections.
- Preserve filters and sorting in the URL, show active selections, support reset, and explain empty results. Define availability using the same matching variant.
- Complete when reload and browser Back preserve state, keyboard and touch controls remain usable, and the local data adapter applies the combined filters correctly. Validate any Shopify query changes against the public schema.
- Route to frontend-engineer and backend-engineer, coordinated by engineering-lead.

### 09. Make every matching catalog item reachable

**Source-confirmed limit.** The listing consumes the products array while discarding pagination metadata. The default request takes 24 products. Demo results always report no next page and omit cursor progression. [Catalog listing](../components/catalog/CategoryListing.tsx#L78), [Demo query results](../lib/shopify/products.ts#L557)

- Demonstrate 25–30 deterministic products, multiple pages, a filtered final page, and a failed continuation request.
- Add accessible continuation using the existing cursor contract. Preserve sort, filters, position, and history behavior.
- Complete when all matching products remain reachable without duplicates or omissions. Distinguish displayed counts from any known total and provide working Retry.
- Route to fullstack-engineer and qa-engineer.

### 10. Expand the fixture catalog beyond the current happy paths

**Source-confirmed coverage limit.** Detail fixtures share a Size/Color schema and provisional information. Catalog fixtures all have media. The crewneck already covers several prices, sold-out pairs, and sellable zero stock. [Fixture definitions](../lib/shopify/preview-demo-fixtures.ts#L147)

- Add named scenarios for absent media/information, a default variant with no selectable options, one option, unknown inventory, long labels, sparse combinations, empty collections, and a larger catalog.
- Keep fixture IDs deterministic and make scenarios reachable through ordinary browsing or a documented local preview entrypoint.
- Complete when card, PDP, Quick Add, outfit, wishlist, and bag journeys handle applicable shapes consistently. Preserve the existing representative crewneck fixture and automated tests.
- Route to ecommerce-merchandiser, backend-engineer, and qa-engineer.

### 11. Improve failed-image presentation outside the fullscreen viewer

**Source-confirmed enhancement opportunity.** The fullscreen viewer has explicit loading/error/retry behavior. Cards, the main gallery stack, bag thumbnails, and Recently Viewed use standard image rendering. Missing-image placeholders already exist in several components. Failed HTTP image requests need their own demonstration. [Product card](../components/catalog/ProductCard.tsx), [gallery stack](../components/product/ProductGallery.tsx), [bag rows](../components/cart/BagView.tsx), [viewer recovery](../components/product/ProductGalleryImage.tsx)

- Demonstrate HTTP 404, delayed decoding, and a failed responsive rendition.
- Complete when layouts reserve image space, meaningful names remain readable, and recovery or fallback is understandable. Preserve server-rendered first-image priority and responsive image quality.
- Route to frontend-engineer and seo-performance-engineer.

### 12. Demonstrate Search recovery with populated results

**Confirmed test-coverage gap.** The existing Search Retry test returns to the unconfigured-store failure. It does not establish recovery to populated results. [Search tests](../tests/e2e/search.spec.ts#L194), [overlay request handling](../components/navigation/SearchOverlay.tsx)

- Demonstrate HTTP 503 followed by success, a delayed older query followed by a newer response, and closing/reopening while a query is pending.
- Complete when current-query results retain ownership, Retry yields usable products/collections, destinations are correct, and focus remains predictable.
- Route to qa-engineer and frontend-engineer. Reuse existing product-request and gallery retry coverage where applicable.

### 13. Extend bag tests to contested and interrupted updates

**Verification opportunity.** Existing tests cover duplicate activation, sequential two-tab adds, storage clearing, invalid saved selections, retry, and blocked persistence. Delayed responses crossing another tab’s update and the browser-without-Web-Locks path need targeted coverage. [Bag tests](../tests/e2e-demo/cart.spec.ts), [cart provider](../components/cart/CartProvider.tsx)

- Demonstrate a held mutation, another tab’s edit, a network disconnect, malformed JSON, unavailable Web Locks, and retry after an intervening update.
- Complete when acknowledged lines remain consistent, stale responses cannot overwrite newer saved intent, failed operations retain understandable recovery, and duplicate adds remain prevented.
- Route to qa-engineer and fullstack-engineer.

### 14. Refresh the website’s technical trust-page descriptions

**Source-confirmed stale copy.** Privacy still describes the retired whole-site password flow and says analytics instrumentation has yet to be added. The accessibility statement records September review timing and describes the former interactive model. Some stated announcement limits need comparison with current behavior. [Privacy draft](../app/(storefront)/legal/privacy/page.tsx#L60), [accessibility statement](../app/(storefront)/legal/accessibility/page.tsx#L31)

- Compare each technical statement with collection access, conditional analytics, browser storage, current look selection, and verified accessibility behavior.
- Complete when the descriptions reflect actual implementation and dated test evidence. Preserve draft labeling and identify unresolved business/legal facts for the owner.
- Route to brand-content-editor with engineering and security verification. Shipping rates, return windows, and legal approval remain owner dependencies.

## P2 local verification and engineering improvements

### 15. Make browser-test environments deterministic

**Source-confirmed configuration gap.** The main suite describes a no-store environment, but its server environment does not explicitly pin all Demo/Shopify settings. Both suites may reuse a server already running locally. [Main browser configuration](../playwright.config.ts#L61), [Demo configuration](../playwright.demo.config.ts#L44)

- Demonstrate conflicting inherited variables and a reused server in the wrong mode.
- Complete when each suite explicitly selects its intended mode and either verifies a reused server or starts an isolated one. Keep credentials out of output and prevent unintended external store calls.
- Route to qa-engineer and devops-engineer.

### 16. Keep production-browser checks repeatable

**Confirmed automation gap.** CI builds production output, while both browser configurations launch the development server. The latest optimized-build checks are recorded local runs. [CI workflow](../.github/workflows/ci.yml#L43), [validation record](./superpowers/plans/2026-11-13-storefront-readiness.md)

- Add a documented local command for a small production smoke in Demo and unconfigured modes.
- Complete when navigation, gallery, search, bag persistence, and focus work against the optimized server. Check the mode during build and startup, and manage ports/server cleanup predictably.
- Route to devops-engineer and qa-engineer. Local execution needs no hosting account.

### 17. Turn performance measurements into a repeatable check

**Verification opportunity.** The readiness record includes three cold mobile samples and JavaScript/layout-shift measurements. Ongoing interaction measurements and a checked-in measurement command are still useful work. [Performance record](./superpowers/plans/2026-11-13-storefront-readiness.md#local-performance-check)

- Measure equivalent production runs with documented network, CPU, viewport, cache, and graphics settings.
- Cover route loading, initial and activated JavaScript, layout shifts, search typing, variant selection, gallery activation, and bag updates.
- Complete when results are reproducible enough to establish justified regression thresholds. Preserve important image detail and keep real-device/frame-rate claims tied to actual measurements.
- Route to seo-performance-engineer and qa-engineer.

### 18. Verify actual browser zoom and assistive-technology behavior

**Documented verification gap.** Narrow reflow, keyboard journeys, and gallery zoom have automated coverage. Actual browser magnification and screen-reader output remain unverified in the readiness record. [Readiness limitations](./superpowers/plans/2026-11-13-storefront-readiness.md), [gallery tests](../tests/e2e-demo/product-gallery.spec.ts)

- Use 200% browser/text zoom and 400% reflow with populated fixtures, long content, modal dialogs, errors, and the expanded mobile action bar.
- Start with an available local screen reader, such as Windows Narrator. Record announcements, control names, reading order, and focus restoration.
- Complete when results include browser, tool, viewport, steps, and reproducible failures. Physical phone gestures and hardware graphics need available devices, with equipment-dependent results tracked explicitly.
- Route to ui-reviewer and qa-engineer.

### 19. Audit accessibility across interactive states

**Audit-coverage opportunity.** The newly reproduced hover-contrast issue escaped the existing focused browser assertions. Search also announces an atomic live results container whose verbosity needs a real screen-reader check. [Search live region](../components/navigation/SearchOverlay.tsx#L304), [browser tests](../tests/e2e-demo)

- Check contrast, accessible names, headings, landmarks, error associations, and focus clearance in default, hover, focus, loading, failure, and modal states.
- Reuse existing browser tooling for targeted regressions. Evaluate any additional test-only dependency against the project’s dependency rules.
- Complete when confirmed issues have regressions and announcements communicate useful changes without reading unnecessary content. Keep a manual record for checks automation cannot establish.
- Route to qa-engineer and ui-reviewer.

### 20. Verify analytics through local UI interactions

**Confirmed coverage gap.** Current adapter tests mock the external sender and run without a browser window. Browser-level event counts and payloads need their own local verification. [Analytics adapter](../lib/analytics/gtag.ts#L35), [adapter tests](../lib/analytics/gtag.test.ts)

- Use a local capture sink or a dummy configuration with all external requests intercepted.
- Complete when settled search, result counts, variant context, wishlist additions, and repeated activation produce intentional events. Verify that simulated bag actions retain their documented analytics semantics and exclude personal or sensitive information.
- Route to data-analytics-engineer and qa-engineer. A GA4 account is unnecessary for this contract check.

### 21. Test the actual Shopify client transport with synthetic responses

**Confirmed coverage gap.** Product/collection tests replace `client.request`. Client tests establish configuration and client creation. The configured SDK’s HTTP boundary can be exercised locally. [Product tests](../lib/shopify/products.test.ts), [collection tests](../lib/shopify/collections.test.ts), [client tests](../lib/shopify/client.test.ts)

- Intercept every outbound request and return success, GraphQL errors, HTTP failures, invalid JSON, and missing optional fields.
- Complete when variables, API version, normalized data, and safe errors match the intended contract. Ensure no request escapes the test transport.
- Route to backend-engineer and qa-engineer. Real store permissions and final catalog behavior remain integration checks.

### 22. Preview Request Access outcomes locally

**Enhancement proposal.** The form and server action exist, while successful delivery depends on the email integration. A controlled local demonstration can exercise success and failure before an account is connected. [Access page](../app/(storefront)/access/page.tsx), [submission action](../app/(storefront)/access/actions.ts)

- Demonstrate validation errors, pending submission, simulated success, service failure, retry, and repeated submission using synthetic contact data.
- Complete when the Demo outcome is clearly identified, keyboard focus and consent remain usable, and no real subscription or email is sent by the local harness.
- Route to fullstack-engineer, brand-content-editor, and qa-engineer. Actual subscription and email delivery remain external integration work.

## P3 design and resilience proposals

### 23. Make placeholder imagery more coherent for design review

**Design proposal grounded in current fixtures.** The crewneck gallery deliberately uses illustrative stock photos from different products. The roadmap also records placeholder silhouette limitations in the closet. [Demo imagery](../lib/shopify/preview-demo-fixtures.ts#L49), [closet limitations](../ROADMAP.md#current-status-updated-2026-11-12)

- Build a coherent synthetic gallery using one licensed garment image and labeled detail crops. Keep mixed-image stress scenarios available separately.
- Explore category-appropriate placeholder silhouettes for the closet using local assets or geometry.
- Complete when image crops, gallery order, zoom, cards, and editorial spacing can be judged together. Label synthetic media and retain asset provenance. Final photography and garment models remain owner assets.
- Route to ui-ux-designer, frontend-engineer, and ecommerce-merchandiser.

### 24. Investigate resilience when JavaScript is delayed or unavailable

**Recorded framework limitation.** The product response contains server-rendered images and links inside a streamed boundary. Existing validation found that the route’s content stays hidden until JavaScript reveals it. [Server-markup test](../tests/e2e-demo/product-gallery.spec.ts#L103), [readiness record](./superpowers/plans/2026-11-13-storefront-readiness.md#implementation-and-review-record), [loading boundary](../app/loading.tsx)

- Demonstrate disabled JavaScript, failed script loading, and slow hydration using local fixtures.
- Investigate supported framework/rendering approaches that keep product information and navigation readable. Explain scripting requirements for interactive enhancements where necessary.
- Complete an architecture decision and browser proof before changing streaming behavior. Preserve first-image performance, route errors, and normal client navigation.
- Route to engineering-lead and frontend-engineer, with architecture-reviewer review.

### 25. Evaluate a local Content Security Policy

**Documented deferred work.** A sitewide Content Security Policy remains an explicit follow-up. Its asset and script compatibility can be explored against local fixtures. [Roadmap engineering items](../ROADMAP.md), [current configuration](../next.config.ts)

- Inventory required script, style, font, image, connection, and 3D-model sources. Exercise a local report-only policy and controlled integration responses.
- Complete when violations are understood and a proposed policy passes production-mode journeys, including gallery media and the graphics fallback. Keep enforcement changes tied to compatibility evidence.
- Route to security-engineer, devops-engineer, and frontend-engineer.

## Execute the backlog with repeatable local demos

Work through items 01–04 first. Establish fixture scenarios and deterministic test environments before expanding filtering or pagination. Review trust-page descriptions alongside the relevant technical changes. Performance and accessibility checks should accompany each affected journey.

For each item, record the baseline revision, fixture scenario, reproduction steps, expected outcome, screenshots where relevant, validation command, and observed result. Update its status only when the implementation and applicable checks support completion. Follow AGENTS.md for role routing, review, and validated publication to `surfacebook`.

Use the existing opt-in Demo Mode for populated journeys. Set `PREVIEW_DEMO_MODE=1` during both production build and startup. Keep a separate unconfigured-mode check and synthetic data for all intercepted service responses. The current local runtime and test commands are recorded in the readiness document. [Runtime and validation commands](./superpowers/plans/2026-11-13-storefront-readiness.md#validation-record)

Final garment measurements, composition, care, photography, approved business policies, live Shopify transactions, real email delivery, account access, and hosted deployment remain owner or service dependencies. Each related item above identifies the interface or local verification that can progress beforehand.

## Keep this inventory current

Refresh this document after each completed group of work. Align stale roadmap and test comments with the newer Demo coverage and D-093 so future work uses the current website baseline. Re-audit after new fixtures expose additional states. The findings reflect the reviewed source and listed demonstrations, with device-dependent and unverified behavior identified explicitly.
