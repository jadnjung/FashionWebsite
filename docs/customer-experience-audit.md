# Demo Mode customer-experience audit

Audited November 13, 2026 against the populated Esque fixtures. The review covers
navigation, search, catalog filters, product selection, purchase feedback,
responsive layout, accessibility, and the homepage's 3D fallback.

## Findings and remediation

| Finding | Customer impact | Remediation |
| --- | --- | --- |
| Full-screen menu lacked a visible close action | Touch users had to navigate away to dismiss it | Added an accessible CLOSE button with a 44px minimum target and trigger-focus restoration |
| Search handled keys belonging to nested Quick Add | Escape dismissed both overlays and lost search context | Search yields keyboard handling to the open native dialog |
| Search trapped focus using retained closed Quick Add controls | Reverse keyboard navigation could target a hidden control | Excluded closed-dialog descendants from Search's focus boundaries |
| Decimal price filters failed native form validation | APPLY silently stayed on the same page for fractional prices | Enabled decimal input and arbitrary supported price steps while preserving GET navigation |
| Purchase placeholders gave no visible response | Valid selections appeared to do nothing | Added truthful, announced availability feedback across PDP, Quick Add, and Shop the Look |
| Sellable backorders displayed SOLD OUT | Inventory copy contradicted Shopify's availability flag | Availability controls sold-out status, with scarcity copy limited to positive known stock |
| WebGL1 devices passed the closet capability probe | The renderer could replace the homepage with an error | Require WebGL2 and retain the static hero and collection link on unsupported devices |
| Software WebGL initialization stalled other shopping interactions | The looks ring and modal interactions became unresponsive | Use the static hero for recognized software renderers and release the disposable capability-probe context |
| Demo Mode bypassed responsive image optimization | Mobile loaded oversized fixture images | Restored the normal optimizer and added rendition/decode checks |
| A portrait hero's cover crop needs more source detail than its CSS width | Width-only image selection could soften the tall crop | Made the hero's responsive sizing account for its 16:9 source and rendered height |
| Safari pointer-opened utility panels lost their return focus | Closing Size Guide, Quick Add, or a look could leave keyboard users without their invoking control | Focus the accepted invoking control before opening the native dialog |
| Drag state suppressed subsequent keyboard look activation | Enter could stop opening looks after a drag | Keep pointer-drag suppression separate from keyboard-generated activation |
| Mount-time route effects could dismiss a newly opened overlay | A first menu/search activation could be lost during hydration | Close overlays only when the pathname actually changes |

The established dark editorial palette, typography, imagery treatment, and motion
direction remain the basis for the experience. This pass prioritizes reachable
shopping and accessibility failures. Image and measurement placeholders are
explicit in Demo Mode and require approved product assets and verified sizing
before launch.

## Performance evidence

The closet's six original fixture photographs total 1,008,446 bytes and contribute
to its first visible frame because photo-based fabric colors share the outer
loading boundary. An isolated Sharp resampling experiment reduced six JPEGs from
399,858 bytes at width 768 to 17,188 bytes at width 128, but changed one garment's
sampled color from near-black to near-white. That optimization was rejected for
this pass because garment color fidelity is part of product quality.

The existing non-Demo build's 3D chunk measured 991,166 raw bytes and 262,106 gzip
bytes. In a controlled production-browser comparison at 1280×720, the looks ring advanced
601 animation frames in 10.0 seconds with the static hero. With the closet
initializing on software WebGL, it advanced 40 frames over 18.0 seconds.
The browser's standard performance-caveat hint accepted that software context,
so the capability probe also checks recognized software-renderer names locally.
GPU details are neither logged nor transmitted. Concealed renderer information
limits this heuristic. Hardware-accelerated behavior still needs physical-device
verification. See D-092 in DECISIONS.md.

Cold-load samples used Playwright Chromium 151.0.7922.34 against a local production
Demo Mode build, with the browser cache disabled and PerformanceObserver entries
collected five seconds after load. The mobile profile was 390×844 at DPR 1,
4× CPU throttling, 1.6 Mbps download, and 150 ms latency. Desktop used 1440×900,
DPR 1, and no throttling. Renderer comparison counted requestAnimationFrame
callbacks for a nominal ten-second window, using fresh contexts with WebGL
enabled or explicitly unavailable and no CPU/network throttling.

| Cold mobile sample | Before image optimization | Cover-aware optimization sample |
| --- | --- | --- |
| LCP | 5.496 seconds | 2.764 seconds |
| Subresource transfer | 1,571,474 bytes | 491,179 bytes |
| Layout shifts without recent input | 0 | 0 |

The optimized unthrottled desktop sample recorded 112 ms LCP, zero layout shifts,
and 506,048 bytes of subresource transfer. Both final profiles retained the
1920px hero rendition and reported no uncaught page errors. These are single-run
local lab samples, with image-optimizer cache state distinct from the disabled
browser cache. They provide comparison evidence, with field INP and real-device
Core Web Vitals still requiring verification.

## Coverage and remaining dependencies

Browser regressions exercise menu dismissal, nested-dialog keyboard handling,
fractional filtering, purchasing feedback, and unsupported-WebGL fallback.
Responsive journeys cover 390px phone, 768px tablet, 1024px laptop, and 1440px
desktop layouts, including size-guide positioning and keyboard focus restoration.
The existing suites additionally cover closet interaction, look navigation,
reduced motion, search recovery, and the unconfigured-store state.
Populated mobile WebKit journeys now run in the regular Demo configuration.
Scene-specific software-WebGL checks use isolated Chromium workers and a separate
shader-compilation budget. Their capability overrides stay within functional
tests, with normal shopping tests and performance measurements using the
application's real capability decision.

Cart mutations, checkout, live inventory races, and order completion require the
Shopify connection and remain outside the fixture audit. Fixture products have
one image and one purchasable M/Black variant, limiting real-world gallery and
combination coverage. Physical iPhone/iPad testing, assistive-technology testing,
field Core Web Vitals, and final-product photography/sizing remain launch checks.

## Validation

Formatting, lint, TypeScript checking, 458 unit tests, and the production Demo
build passed. The 14 closet/fallback cases passed in the full desktop/touch
Chromium run. After the native-dialog fixes, the final affected-journey pass
covered desktop Chromium, touch Chromium, and mobile WebKit with 95 passed and
four mobile-inapplicable hover checks skipped.

Populated checks used a production server built and started with
`PREVIEW_DEMO_MODE=1`. No-store checks used a separate server with Demo Mode off
and store credentials unset. The populated integration command was

```powershell
python -B -X utf8 .codex/tools/run_project.py exec playwright test -c playwright.demo.config.ts --grep-invert 'Collection Closet' --workers=1 --reporter=line
```

The no-store smoke, search, and reduced-motion checks passed 135 cases in
Chromium and mobile WebKit, with one browser-inapplicable case skipped. After the
mount-time overlay correction, all 24 populated navigation cases passed again
across the three browsers. The four previously failing Safari menu journeys also
passed three repetitions each. The clock boundary test passed six repeated checks.

Read-only UI, performance, and security reviews covered the application changes
and fixes. The security reviewer reached a usage limit before the final check of
the clock-test adjustment. The coordinator loaded the security-engineer role and
security-guidance skill, reviewed that adjustment directly, and found no security
issue. Source-integrity and secret-pattern checks passed.

Hosted CI results are separate from the local verification recorded here.
