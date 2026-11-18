# Selected quantity in purchase-intent analytics, item 55

## Starting point

Published base is 6d201c3dadad8d8171e35136f2db30dc227be71c on surfacebook. Matching CI 44179007153 is running. Preserve unrelated debug.log and Claude compatibility files. Parent owns documents, integration and publication.

The PDP currently emits add_to_bag_click with unit price as event value and no quantity, then resolves quantity for cart.addItems. Quick Add always requests one unit and emits quick_add_click. These are the only production callers of those two events. Shop the Look has no such event in its current add handler. Views and wishlist use the shared AnalyticsItem shape independently.

## Contract

Define a purchase-specific item extending AnalyticsItem with required numeric price and quantity. Use it only for the two purchase-intent events. Preserve the existing handle/variant identifiers and unrelated event shapes. Item price is selected-variant unit price. Quantity is the normalized requested addition, excluding units already in the bag. Event value is price multiplied by that quantity, excluding tax, shipping and unavailable discount facts. At USD 128 and quantity three, emit price 128, quantity 3 and value 384.

Resolve the PDP quantity once before telemetry and reuse that snapshot in cart.addItems. Quick Add declares quantity one. Each accepted Add activation represents an intent, including one whose mutation later fails. Retry replays the stored operation and produces no additional Add intent. A separate new Add activation can produce a new intent. Historical records lacking quantity cannot recover the original multi-unit choice.

Google documents unit price, quantity and price-times-quantity value semantics. These custom event names retain the project's purchase-intent meaning. [GA4 event reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#add_to_cart)

## Decimal values and scope

formatPrice is display-only. Demo cart arithmetic is inline and USD-specific, so it should not be imported into client analytics. Use a small pure amounts helper if needed to avoid 10.01-times-three and 0.10-times-three floating artifacts. Shopify Decimal is arbitrary precision, serialized as a string, including documented three-decimal examples. The official definition does not guarantee a particular exponent grammar. Accept ordinary signed decimal and scientific forms defensively, preserve representable zero/decimal values, and omit invalid or unrepresentable telemetry while continuing the cart operation. Avoid a new currency/stock/quantity business policy or dependency. [Shopify Decimal](https://shopify.dev/docs/api/storefront/latest/scalars/decimal)

The helper should return explicit numeric unit price and line value only when their serialized numeric representation preserves the intended decimal values. Unit price remains separate. Guard non-finite and unsafe quantities. A guarded optional telemetry path must not control whether cart.addItems runs.

## Required evidence

- Reproduce missing quantity/incorrect multi-unit intent value through the existing PDP before implementation.
- Verify quantities one and three, fractional flooring and current stock/Demo-cap normalization. Captured quantity and mutation payload must agree.
- Assert explicit unit price, correct line value and unchanged selected variant/handle fields.
- Verify Quick Add quantity one, failed-add intent once and Retry retaining the original quantity without a duplicate intent.
- Unit-check ordinary decimal/scientific values, zero, fractional precision and invalid/unrepresentable values. Retain existing view/wishlist expectations.
- Complete primary quality and mandatory security review, parent integrated validation and relevant ordinary shopping/analytics browser coverage before branch-only publication.

## Ownership

Analytics specialist completed read-only contract discovery. Implementation assignment will own events types/comments/tests, PDP, Quick Add, the small pure amounts helper/tests if needed and shopping-journey regressions. Parent owns project documents and publication. No item 55 application edits or owned server exist at plan creation.


## Implementation and review milestones

Normal optimized PDP RED confirmed the existing cart request already contained quantity three, while add_to_bag_click omitted quantity and reported value 128 instead of 384. The worker then added the purchase-only required price/quantity type, one normalized PDP snapshot shared with the mutation, explicit Quick Add quantity one and a pure decimal coefficient/exponent helper with numeric serialization round-trip checks. Views, wishlist and Retry keep their existing contracts.

Initial helper unit work passed 35 cases, and full units passed 671 across 63 files. The first 50-case normal shopping run passed after correcting test assumptions about editing quantity hiding Retry and desktop Quick Add requiring focus/hover. The fractional case starts with two saved units, adds three and reaches five, proving the intent records the addition. Unit/type/lint/format checks passed at that snapshot.

Primary review confirmed negative product prices were incorrectly emitted. Shopify's variant-price contract rejects negative prices, so the exported purchase helper now rejects negative coefficients while retaining zero/free values. Security review confirmed an unbounded finite amount could construct a huge BigInt and perform repeated divisions before cart mutation. The helper now rejects more than 512 characters before parsing. Three focused RED tests reproduced the negative plain/scientific and oversized acceptance, then full units passed 673/63 files. Both reviewers cleared those fixes. [Variant-price constraints](https://shopify.dev/docs/api/admin-graphql/2026-07/enums/ProductVariantsBulkUpdateUserErrorCode)

Parent then directly executed getPurchaseAmounts(null,1) and confirmed a TypeError caused by reading length before validating the amount type. A malformed JSON amount can reach this optional telemetry boundary, while Number(null) display formatting itself returns zero. Worker was assigned an upfront string-type guard, focused non-string omission tests and a null-amount Quick Add mutation regression. This fix and its final reviews/browser verification remain pending. The helper must not make optional telemetry a condition for cart submission.

Worker owns optimized server 37231 and 60-case run 71439 for the pre-null-guard snapshot. It will finish that run before changing collected test declarations, then rebuild and verify the final fault table. No item55 commit or push has occurred. Parent's separate CI reporter commit c7fff19 is published; item55 files are excluded from it.


## Final guard and runtime verification

The non-string boundary RED reproduced null/undefined exceptions and numeric-zero acceptance in three failing focused cases. The helper now accepts unknown and validates typeof string before length/parsing. Focused helper coverage increased to 43 cases and full units passed 679 across 63 files. Primary and security re-review cleared the final guard while retaining the prior negative/size/round-trip protections. Reviewed helper SHA256 is 11433fa19077011390dcffde6ab977493ed5fc8f9a16c7a7ee989cc98bab96d5.

Final optimized Demo build/server 39743 succeeded. A focused null Quick Add case passed, followed by all 65 shopping-journey cases across five profiles in 1.0 minute (5725). This covers original journeys, quantities one/three, addition versus bag total, fractional/stock/Demo normalization, failed-add Retry snapshots, explicit Quick Add one and malformed telemetry allowing canonical mutation. All owned servers were stopped.

Parent integrated run 38389 passed 679/63 files in 15.98 seconds, typecheck 73762 and full lint 83428 passed. Source behavior is frozen. Parent corrected two stale analytics comments about context and grant consumption without changing behavior. Final formatting, document checks and branch-only publication remain next. No live account ingestion is claimed.


## Final integrated completion

Parent full formatting passed after documentation and comment updates. The final parent eight-path fingerprint is ad3d8499841e208381f88c38fbf50a51f6e3dbff6d673a3b00b98dcef4e20a5d. Its difference from the worker's 9191ffcbf6393c5ba6bf7cd9954a8871f090a3eaa0384bdf76c744a9679e8529 is the parent's two stale-comment corrections in events.ts. Runtime behavior is unchanged, and helper SHA256 still matches both final reviewers at 11433fa19077011390dcffde6ab977493ed5fc8f9a16c7a7ee989cc98bab96d5. Branch-only publication and matching hosted CI are the remaining steps.


## Publication

Verified surfacebook before commit and again before explicit push to HEAD:refs/heads/surfacebook. Published 90a44916671c47afe5a52b3b9a6fa380ffaa56ed and confirmed the same remote revision. Matching hosted CI [44224527084](https://github.com/jadnjung/FashionWebsite/actions/runs/44224527084) is in progress. Local source, reviews and validation are complete, with hosted verification pending. Related checkpoint/publication updates may remain uncommitted during the next task.


## Hosted follow-up, November 18 UTC

Matching run 44224527084 completed with failure in the unconfigured tablet legal-page check, not the quantity assertions. Demo completed 850 checks with 23 skips and the recovered Quick Add opening issue tracked under item 76. Collections completed 59 checks with nine skips and two recovered Search cursor-navigation races. Item 75 records the legal-page RSC access-control errors and investigation. Local quantity validation remains as recorded; hosted overall success is not claimed.
