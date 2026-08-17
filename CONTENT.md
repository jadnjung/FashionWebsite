# Esque — Content & Voice Specification

Purpose: copy style, product copy, empty-state language, error language, and naming — the single reference for anyone writing or reviewing customer-facing copy on Esque. Per [DESIGN_SYSTEM.md §76](./DESIGN_SYSTEM.md#76-contentmd), this defines Esque's voice.

This document consolidates copy rules and concrete microcopy that live in [PROJECT.md](./PROJECT.md) and [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — each section cites its source. When writing new copy, match the tone and patterns below rather than inventing a new style.

## 1. Voice

Esque's voice should be:

- concise
- confident
- restrained
- mysterious
- precise

Avoid:

- excessive exclamation marks
- slang-heavy marketing
- generic lifestyle copy
- long explanations

Example:

Bad: `We're so excited to introduce our amazing new collection!`

Better: `COLLECTION 001` / `AVAILABLE UNTIL GONE.`

The brand should feel like an emerging fashion house that already understands its identity, rather than an amateur clothing startup — mysterious enough to create intrigue, informative enough that customers understand what they're buying.

Source: [DESIGN_SYSTEM.md §76](./DESIGN_SYSTEM.md#76-contentmd), [PROJECT.md §3](./PROJECT.md#3-brand-personality)

## 2. Case Conventions

- Primary navigation: UPPERCASE
- Product names: Flexible
- Editorial headings: Usually uppercase
- Descriptions: Sentence case

Do not make every piece of text uppercase — reserve it for navigation and editorial moments, not body copy.

Source: [DESIGN_SYSTEM.md §12](./DESIGN_SYSTEM.md#12-case)

## 3. Access Gate Copy

Entry:

```
ENTER ESQUE
[password field]
ENTER          REQUEST ACCESS
```

Supporting text: `ACCESS TO CURRENT COLLECTIONS.` — avoid paragraphs explaining the system.

Source: [DESIGN_SYSTEM.md §54](./DESIGN_SYSTEM.md#54-access-ui-copy)

## 4. Request Access Copy

Fields: `FIRST NAME`, `EMAIL`

Consent checkbox: "I agree to receive Esque emails, including access and collection updates."

CTA: `REQUEST ACCESS`

Confirmation: `ACCESS SENT.` Secondary: `CHECK YOUR EMAIL.`

Access email structure — minimal, no generic newsletter aesthetic:

```
ESQUE
ACCESS GRANTED
CURRENT ACCESS
XXXXXX
ENTER ESQUE
```

Source: [DESIGN_SYSTEM.md §55](./DESIGN_SYSTEM.md#55-request-access-form), [PROJECT.md §19, §21](./PROJECT.md#19-request-access)

## 5. Incorrect Password Microcopy

Never the generic `Incorrect password.` — use branded, rotating microcopy instead. Approved examples:

- `NOT THIS ONE.`
- `ACCESS NOT RECOGNIZED.`
- `TRY ANOTHER.`
- `ACCESS DENIED.`
- `TRY AGAIN.`

The response should be playful and mysterious rather than punitive. Unlimited attempts are allowed — this is a brand gate, not a security boundary (see [DECISIONS.md D-005](./DECISIONS.md#d-005--access-gate-is-a-ui-layer-experience-not-an-seo-wall) for the related architectural note).

Source: [PROJECT.md §17](./PROJECT.md#17-incorrect-password-experience), [DESIGN_SYSTEM.md §56](./DESIGN_SYSTEM.md#56-incorrect-password)

## 6. Error States

Even utility experiences stay on-brand — creativity must never obscure what happened or how the visitor recovers:

| Situation | Copy |
|---|---|
| 404 | `THIS PIECE DOESN'T EXIST.` |
| Search, no results | `NOTHING MATCHES.` |
| Sold out | `NO LONGER AVAILABLE.` |
| Network failure | Clear explanation + `Retry` |

Source: [PROJECT.md §87](./PROJECT.md#87-error-states)

## 7. Empty States

Opportunities for subtle brand expression, not dead ends:

| Situation | Copy |
|---|---|
| Bag | `YOUR BAG IS EMPTY.` |
| Wishlist | `NOTHING SAVED YET.` |
| Archive before additional drops | `THE ARCHIVE BEGINS HERE.` |

Source: [PROJECT.md §89](./PROJECT.md#89-empty-states)

## 8. Scarcity & Availability Copy

Permitted, truthful examples: `LOW STOCK`, `3 REMAIN`, `FINAL PIECES`, `SOLD OUT`.

Never generate fake viewer counts or fabricated urgency — use only real inventory information.

Sold-out / archived product states: `SOLD OUT` or `ARCHIVED`; purchasing controls on unavailable archived products read `UNAVAILABLE`. Future: `NOTIFY IF RETURNED`.

Drop status example:

```
COLLECTION 001
06 PIECES
AVAILABLE UNTIL GONE
```

Source: [PROJECT.md §40–41, §46](./PROJECT.md#40-sold-out-products), [DESIGN_SYSTEM.md §35, §47](./DESIGN_SYSTEM.md#35-homepage--scene-06-drop-status)

## 9. Search Copy

Overlay opening state: `SEARCH ESQUE`. No-result state: `NOTHING MATCHES.`

Source: [DESIGN_SYSTEM.md §50](./DESIGN_SYSTEM.md#50-search)

## 10. Call-to-Action Vocabulary

Reuse these established CTA phrases rather than inventing synonyms:

`ENTER COLLECTION` · `SHOP THE LOOK` · `ADD LOOK` · `ADD TO BAG` · `VIEW PRODUCT` · `QUICK ADD` · `ENTER ARCHIVE` · `EXPLORE COLLECTION →`

Editorial CTAs are often text-based (`EXPLORE COLLECTION →`) rather than large filled buttons.

Source: [DESIGN_SYSTEM.md §17](./DESIGN_SYSTEM.md#17-buttons), scattered scene/CTA references throughout PROJECT.md and DESIGN_SYSTEM.md

## 11. Naming Conventions

- **Products:** placeholder names follow a `[Type] [Number]` pattern (e.g. `T-Shirt 01`, `Hoodie 02`, `Pants 01`) until official naming is created. Placeholder photography accompanies placeholder names.
- **Collections:** `Collection 001`, `Collection 002`, … — sequential, never renamed retroactively once archived.
- **Categories:** use `Etc.` rather than the conventional `Accessories` — an intentional personality choice, not a placeholder.
- **Cursor/UI states:** short, uppercase verbs (`VIEW`, `SHOP`, `DRAG`, `OPEN`, `NEXT`).

Source: [PROJECT.md §8–9](./PROJECT.md#8-launch-collection)
</content>
