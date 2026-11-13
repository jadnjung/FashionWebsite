---
name: "fashion-commerce"
description: "Implement or review fashion storefront journeys, product and size data, variants, collections, drops, cart and checkout handoff, merchandising, and brand content in this Shopify-backed Esque storefront."
---

# Fashion commerce delivery

Read the applicable PROJECT.md, CONTENT.md, ARCHITECTURE.md, ROADMAP.md, and current decisions. Establish the journey being changed and its acceptance criteria. Apply the relevant checks below within that scope.

## Product discovery and merchandising

- Use actual product, collection, and look data. Make demo fixtures and production data distinguishable in implementation and tests.
- Check taxonomy, sorting, filters, search, product counts, empty results, and actual product or collection destinations.
- Represent availability at the selected variant. Check sold-out, missing media, partial data, and unavailable-store behavior.
- Keep upcoming, current, and archived collections consistent with documented release rules and timezone assumptions.
- Preserve curated look ordering and product relationships. Check missing or unpublished items and accessible navigation through the looks ring.

## Product detail and buying confidence

- Match size and color labels to Shopify options and variant IDs. Check selection reset behavior and availability when an option changes.
- Use verified garment measurements, fit descriptions, supplied model measurements, materials, care, and shipping/return facts. Track missing facts explicitly.
- Preserve currency and minor-unit accuracy. Never infer discounts, stock counts, scarcity, delivery dates, sustainability claims, or endorsements.
- Inspect product photography crops, gallery navigation, media controls, meaningful alt text, and loading priorities.

## Cart and checkout

- Keep Shopify authoritative for prices, inventory, cart lines, totals, and checkout URLs.
- Test quantities, duplicate submission, mutation failures, unavailable variants, stale stock, and recovery when applicable.
- Check selected variants and quantities through the server boundary and response. Account for pending, success, empty, and failure states.
- Check analytics at the intended point of success. Avoid duplicate attribution and personal data in events.
- Follow the project's hosted Shopify checkout handoff when the task includes cart or checkout implementation.

## Visual design and accessibility

- Apply Esque's documented typography, spacing, dark editorial palette, sparse forest-green accent, and motion rules.
- Check touch, keyboard, focus restoration, dialogs, screen-reader labels, zoom, reduced motion, and non-WebGL fallback for relevant surfaces.
- Keep product choices understandable during animation. Measure the affected page and device class when making performance claims.

## Content and external operations

- Coordinate product facts with ecommerce-merchandiser and customer-facing language with brand-content-editor.
- Confirm that access, subscription, and transactional messages match actual integration behavior.
- Keep external catalog writes, email sends, account changes, and deployments within the task's explicit authorization.
- Record product-data or account dependencies and continue independent implementation or validation where possible.

Return the journey checked, file references, validation results, and remaining data or account dependencies. Use the handoff contract in .codex/AGENT_WORKFLOW.md.
