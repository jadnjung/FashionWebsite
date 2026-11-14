# Storefront readiness implementation plan

Use the subagent-driven-development workflow for independent implementation
areas. The coordinator owns integration, browser execution, review, validation,
and publication to `surfacebook`.

## Goal

Improve the shopping experience with the current opt-in Demo catalog while
preparing the website for verified product data and a future Shopify connection.

## Architecture and design

Keep the existing dark Esque palette, typography, responsive grid, and native
interaction patterns. Keep the first product image server rendered and optimized.
Load fullscreen product media on demand. Use explicit controls alongside swipe,
native dialogs for focus containment, and reduced-motion support.

Use public plain-text Shopify product metafields for materials, fit, and care.
Missing fields receive honest pending-content guidance. Shipping and returns
link to the existing draft policy pages. Demo content remains labeled.

The Demo bag reconciles variant references and quantities against server-owned
fixtures. Persist references with a versioned browser-storage schema. Display
canonical simulated prices and totals returned by the server. The production
boundary continues to require Shopify, and checkout exposes its unavailable
state. Simulated actions remain separate from real commerce analytics.

## Implementation sequence

- [x] Add gallery navigation, fullscreen zoom, keyboard controls, focus
      restoration, touch swipe, and lazy fullscreen images.
- [x] Improve narrow-screen filters and add mobile purchase controls sharing
      the main selection and purchase state.
- [x] Add server-rendered product information, plain-text metafield mapping,
      missing-content handling, and policy navigation.
- [x] Harden saved-item persistence and improve removal, empty-state discovery,
      and returning-visitor behavior.
- [x] Build the Demo bag interface and integrate PDP, Quick Add, Shop the Look,
      and Header. Cover loading, errors, retry, quantity edits, removal, and
      empty state.
- [x] Review keyboard, focus, touch targets, screen-reader semantics, reflow,
      reduced motion, and loading performance across the affected journeys.
- [x] Run integrated formatting, lint, TypeScript, unit, browser, and production
      build validation. Fix confirmed defects and re-review fixes.
- [x] Complete independent quality and security reviews and inspect the final diff.
- Publish the validated change with one commit and an explicit push to `surfacebook`.

## Ownership

The gallery specialist owns gallery implementation and its browser tests. The
saved-items specialist owns wishlist logic, components, and focused tests. The
commerce specialist owns the Demo bag, purchase entrypoints, mobile purchase
bar, Header integration, and focused cart tests. The coordinator owns product
information, narrow-screen filters, integration, documentation, and validation.

## Acceptance and remaining dependencies

Preserve existing variant IDs, accurate selected pricing, inventory bounds, and
unavailable combinations. Support persisted data created before these changes,
restricted storage, failed requests, retries, and concurrent user actions.
Evaluate phone, tablet, laptop, and desktop layouts. Retain native browser zoom
and keyboard access. Measure affected loading behavior before making performance
claims.

Final garment photography, composition, care, fit, measurements, approved legal
policies, live Shopify inventory/cart/checkout, account merging, field performance,
and physical-device testing depend on assets, decisions, or connections that
remain outside the available Demo environment.


## Implementation and review record

The gallery keeps its server-rendered stack and adds wrapping navigation, native
fullscreen viewing, zoom, horizontal swipe intent detection, image retry, and
focus restoration. Tests inspect the complete server markup before hydration.
The existing App Router streaming boundary requires JavaScript to reveal this
route. These checks cover its server markup.

Mobile controls share the main purchase state and expose pending, success,
failure, and retry feedback in the viewport. Their measured height reserves
space for content and keyboard focus. Filters and menu controls provide 44px
interaction targets. The 320px header keeps the bag label on one line and clear
of the wordmark.

The Demo bag uses canonical server fixture values. Unknown or excessive saved
selections remain visible in a recovery section while valid lines retain their
subtotal. Reference updates are serialized with Web Locks. A fallback detects
concurrent changes and explains the single-tab limitation. Blocked storage keeps
changes for the current visit. Wishlist visit-only changes remain authoritative
in that tab while persistence is blocked. Bag items can be saved to the wishlist.

Independent architecture and UI reviews identified recovery, concurrency,
quantity-limit, feedback, and keyboard-focus defects. Implementers fixed them,
and the coordinator verified the architecture corrections. Native UI and security
reviewers completed focused re-reviews with no remaining actionable findings.
Visual inspection covered desktop product/bag layouts, a mobile gallery viewer,
and phone product/bag layouts. Browser tests own the final functional evidence.


## Local performance check

Three cold browser contexts at 390×844 used Chromium, 4× CPU throttling,
1.6 Mbps download throughput, 150 ms latency, disabled browser cache, and
WebGL disabled. The baseline production build at `5aebbb3` recorded LCP samples
of 2.484, 1.880, and 1.996 seconds. The final Demo build recorded 1.780, 1.776,
and 1.760 seconds. Baseline cumulative layout shift was zero. Final samples
ranged from zero to 0.00023.

Encoded JavaScript resource bodies totaled 166,627 bytes in the baseline and
177,142 bytes in the final build. These local samples provide a regression signal.
Real-device responsiveness, frame rates, assistive-technology output, and field
Core Web Vitals still need verification. The document viewport enables native
browser scaling. A focused footer link remained above the expanded mobile bar
in the final inspection, with its bottom at 647.5px and the bar starting at
687.5px in an 844px viewport.

## Validation record

Repository formatting, lint, TypeScript checking, and all 491 unit tests passed.
The canonical cart/route suite also passed 11 focused cases after recovery-label
changes. Both opt-in Demo and normal unconfigured production builds passed.

The broad populated production run covered 195 cases across desktop Chromium,
mobile Chromium, and mobile WebKit. It passed 182, skipped four mobile-inapplicable
hover checks, and exposed nine focus or duplicate-price assertions. Those defects
were fixed. UI review added sticky-feedback and failed-removal regressions. The
final affected-journey run passed all 60 cases, including the corrected header,
quantity-update focus, retry focus, sticky pending/failure/success feedback,
body spacing, and failed-removal recovery. Gallery, saved-item, navigation,
product-information, image optimization, and reflow checks passed in the broad
run. The separate unchanged Collection Closet suite was excluded.

The affected-journey command was

```powershell
python -B -X utf8 .codex/tools/run_project.py exec playwright test -c playwright.demo.config.ts tests/e2e-demo/cart.spec.ts tests/e2e-demo/purchase-feedback.spec.ts tests/e2e-demo/variant-fixtures.spec.ts --workers=1 --reporter=line
```

Normal-mode checks use a separate build and server with `PREVIEW_DEMO_MODE` and
store/integration credentials unset. Demo preview builds must set
`PREVIEW_DEMO_MODE=1` during both build and server startup.


The normal-mode production pass completed with 347 passed and five
browser-inapplicable checks skipped across phone, tablet, laptop, and desktop
profiles. It covered smoke/navigation, search, saved-item empty states,
unconfigured bag/API behavior, responsive layout, and reduced motion.

A final bag pass added same-product multi-variant coverage and passed all
33 cases across the three Demo browser profiles. Distinct size/color labels,
quantities, prices, subtotal, and removal targets were verified independently.
The final native security review covered the complete source diff and all fixes,
with no findings. Final UI re-review found no remaining actionable issue.

Hosted CI and physical-device results are separate from these local checks.
