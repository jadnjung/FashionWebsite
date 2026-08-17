# Esque — Design System & Interaction Specification

Brand: Esque
Version: 0.1
Purpose: Define the visual language, interaction system, page behavior, motion rules, responsive behavior, and implementation constraints for the Esque storefront.

## 1. Design Philosophy

Esque should feel like:

> Swiss editorial design × contemporary fashion × Apple-level interaction polish × underground fashion-house mystery

The interface should be visually experimental while remaining structurally familiar.

Core principle:

> Experimental presentation. Familiar interaction.

Users should never need to learn how to:

- navigate
- search
- select a product
- choose a size
- add to bag
- check out

The experimentation should happen around those actions rather than replacing them.

## 2. Experience Hierarchy

Every page should prioritize:

1. Brand identity
2. Visual storytelling
3. Product discovery
4. Product information
5. Conversion

Esque should not immediately feel like:

> product → price → buy

Instead:

> world → collection → garment → desire → product → purchase

## 3. Primary Visual Direction

### Overall Environment

Default visual environment: Dark editorial

Primary surfaces:

- near-black
- black
- charcoal

Typography:

- white
- off-white
- muted gray

Accent:

- forest green

Individual drops may introduce additional colors without changing Esque's global identity.

## 4. Core Color System

### Background — Absolute Black

`#050505`

Primary page background.

Avoid pure `#000000` everywhere because slightly lifted black gives images and shadows more room.

### Surface Black

`#0B0B0B`

Used for:

- cards
- menus
- dialogs
- input surfaces
- secondary content regions

### Elevated Surface

`#121212`

Used sparingly for:

- account UI
- filters
- controls
- checkout-supporting interfaces

### Primary Text

`#F3F1EA`

Slightly warm off-white. Use instead of pure white for most typography.

### Secondary Text

`#A5A5A0`

Used for:

- descriptions
- metadata
- inactive controls
- product details

### Muted Text

`#666662`

Used carefully for tertiary information.

### Esque Forest

Recommended starting point: `#1F3D2B`

This is the primary brand green. It should feel:

- deep
- restrained
- expensive
- organic

Not:

- neon
- bright
- sporty

### Forest Highlight

`#335B41`

Used for:

- selected interaction states
- controlled hover treatments
- occasional highlights

### Error

`#A74338`

Should be used extremely sparingly. Where possible, errors should rely on typography and motion rather than bright red UI.

## 5. Color Usage Rule

Approximately:

- 80% monochrome
- 15% imagery / collection color
- 5% Esque forest green

Forest green becomes more valuable because it is uncommon.

Do not make every button green. Primary buttons may usually remain white-on-black or black-on-white.

Green should often indicate:

- selection
- special access
- active collection states
- rare moments of emphasis

## 6. Typography System

Esque uses a two-part system.

### Typeface A — Functional Swiss Sans

Used for:

- navigation
- controls
- product information
- forms
- account
- checkout
- filters
- utility text

Recommended starting direction: Helvetica Neue / Neue Haas Grotesk style

If licensing becomes an issue, select a high-quality modern grotesk alternative.

## 7. Typeface B — Editorial Display

Used for:

- hero typography
- collection names
- transitions
- campaign statements
- oversized navigation
- selected product storytelling

This typeface can be more expressive. However, it should not feel ornamental or traditionally luxurious.

Avoid:

- overly decorative serif fonts
- wedding/editorial serif styles
- vintage luxury clichés

Preferred direction:

- condensed grotesk
- extended grotesk
- experimental neo-grotesk
- selective serif contrast if later justified

## 8. Typography Personality

Typography should feel:

- architectural
- controlled
- intentional
- asymmetric
- contemporary

Large typography may extend partially off-screen.

Words may occasionally:

- overlap imagery
- move behind models
- become masks
- change size while scrolling
- split across the viewport

But product information must remain conventional and readable.

## 9. Type Scale — Desktop

**Display XL** — `clamp(72px, 11vw, 180px)` — Collection titles and major editorial moments.

**Display L** — `clamp(56px, 8vw, 128px)` — Navigation and homepage feature typography.

**Heading 1** — `48px`

**Heading 2** — `36px`

**Heading 3** — `26px`

**Product Name** — `16px`

**Body** — `15px`

**Utility** — `13px`

**Metadata** — `11px`

Typography should rely heavily on spacing and scale rather than excessive font weights.

## 10. Weight System

Prefer:

- Regular
- Medium

Occasionally:

- Light

Avoid excessive:

- Bold
- Extra Bold
- Black

Large size should create impact instead of heavy weight.

## 11. Letter Spacing

- Display typography: `-0.03em` to `-0.01em`
- Navigation: `0.02em` to `0.08em`
- Small metadata: `0.08em` to `0.14em`

This creates a controlled editorial contrast.

## 12. Case

- Primary navigation: UPPERCASE
- Product names: Flexible.
- Editorial headings: Usually uppercase.
- Descriptions: Sentence case.

Do not make every piece of text uppercase.

## 13. Spacing System

Base unit: `4px`

Core spacing values: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`

Large editorial layouts may exceed this scale.

## 14. Page Margins

- Desktop: `32–48px`
- Large desktop: `48–64px`
- Tablet: `24px`
- Mobile: `16px`

The layout should feel spacious without wasting viewport area.

## 15. Grid

- Desktop: 12-column grid
- Tablet: 8 columns
- Mobile: 4 columns

Product layouts may intentionally break the visual grid while still being based on it internally.

## 16. Shape Language

Esque should avoid excessive rounded cards.

Recommended:

- mostly square corners
- 0–4px radius for standard interfaces
- moderate rounding only where interaction requires it

Avoid the generic SaaS aesthetic of: `rounded card + shadow + pill button`

## 17. Buttons

### Primary

- Background: `#F3F1EA`
- Text: `#050505`
- Shape: mostly rectangular
- Hover: subtle inversion, typography movement, slight magnetic interaction

### Secondary

Transparent. Thin border.

Hover may: fill, invert, reveal underline, shift text

### Editorial CTA

Often text-based: `EXPLORE COLLECTION →` instead of large filled buttons.

## 18. Hover Philosophy

Hover should communicate responsiveness.

Preferred:

- image change
- small positional movement
- typography shift
- masking
- scale around 1.01–1.03
- opacity changes
- cursor label

Avoid:

- giant scaling
- excessive bouncing
- glowing neon borders
- gimmicky rotations

## 19. Motion Personality

Motion should feel: **Fast, controlled, physical and intentional.**

Not:

- floaty
- slow
- whimsical
- overly elastic

## 20. Motion Curves

Recommended standard easing: `cubic-bezier(0.22, 1, 0.36, 1)`

Use for: reveals, menus, page transitions, product expansion.

For short microinteractions: `ease-out`

Avoid uncontrolled spring effects throughout the site. Physics may be used specifically for drag interactions.

## 21. Motion Timing

**Micro** — 120–200 ms — icon state, underline, button feedback

**Standard UI** — 200–350 ms — filter, menu item, quick add

**Layout** — 350–500 ms — card expansion, navigation transformation

**Editorial** — 500–800 ms — hero transition, collection entrance, major shared image transition

Do not routinely exceed 800 ms.

## 22. Custom Cursor

Desktop only.

Default: small circular cursor or precise dot. Suggested diameter: `8px`

Interactive mode: expands approximately `48–72px`

Text inside may become: VIEW, SHOP, DRAG, OPEN

The cursor follows movement with extremely light interpolation. Lag must remain low. If the cursor feels delayed, disable interpolation.

## 23. Cursor Accessibility Rule

Do not hide the operating-system cursor until the custom cursor has initialized successfully.

Disable custom cursor for:

- touch
- reduced-motion users if appropriate
- low-performance devices
- form inputs where precision matters

## 24. Main Navigation — Desktop

Default header approximately: `72px`

Structure: `ESQUE  MENU SEARCH ACCOUNT BAG (0)`

Optional contextual center: `COLLECTION 001`

Header should be:

- minimal
- transparent over hero when readable
- solid/dark after necessary scroll state

## 25. Menu Experience

Clicking MENU creates a full-screen transition.

Background: black.

Primary categories appear as oversized typography: NEW, TOPS, BOTTOMS, ETC., COLLECTIONS

Secondary navigation remains smaller.

Hovering TOPS:

- typography shifts slightly
- relevant model/product image appears
- subcategories reveal
- custom cursor changes to OPEN

Subcategories: T-SHIRTS / SHIRTS / HOODIES / SWEATERS / JACKETS

## 26. Menu Transition

Opening:

1. Background mask expands.
2. Navigation typography enters vertically.
3. Editorial imagery fades/reveals.
4. Utility navigation appears.

Total duration: approximately 350–500 ms. Closing should be slightly faster.

## 27. Homepage — Scene 01: Collection Hero

Height: approximately `100svh`

Content:

- collection imagery
- COLLECTION 001
- short campaign statement
- ENTER COLLECTION

Large ESQUE typography may exist partially outside the viewport.

Subtle mouse movement creates depth between typography, model, and background. Movement should stay within a few pixels.

## 28. Hero First Load

Recommended sequence:

1. Black screen already present.
2. Main campaign image reveals using mask.
3. Collection identifier appears.
4. ESQUE typography resolves.
5. Navigation fades in.

Total: approximately 600–900 ms. No multi-second splash screen.

## 29. Homepage — Scene 02: Interactive Model

One large still model photograph. Copy: `LOOK 01` or collection-specific equivalent.

Hovering a garment (e.g. hoodie):

- hoodie remains normally exposed or slightly brightens
- surrounding outfit reduces toward approximately 35–50% visual emphasis
- product name, category, sizes/colors may appear
- VIEW / QUICK ADD

Highlight should appear sophisticated rather than literally outlining the garment with a glowing border. Preferred technique: masked luminance/exposure treatment rather than obvious glow.

## 30. Interactive Model Hotspots

Hotspots should approximately follow garment silhouettes rather than rectangular boxes.

Implementation options: SVG masks, polygon hit regions, image masks. Do not rely on tiny manually positioned circles.

## 31. Shop the Look

Position: lower corner or contextual side panel.

CTA: `SHOP THE LOOK`

Opens a floating or side panel containing all garments, e.g.:

```
01 — Hoodie
02 — Pants
03 — Jewelry
```

Each item displays variant controls where required. Final CTA: `ADD LOOK`

## 32. Homepage — Scene 03: Collection Statement

Typography-first. Example: large text `NOT MADE TO REMAIN.`, smaller text `COLLECTION 001`.

Editorial imagery appears in smaller intentional placements. Use parallax sparingly.

## 33. Homepage — Scene 04: Selected Pieces

Three or four products maximum. Avoid displaying the entire collection like a conventional grid.

Potential composition: large product left, smaller product upper-right, another product lower-right.

Names remain visible. Prices hidden until product interaction.

## 34. Homepage — Scene 05: Categories

Large text: TOPS, BOTTOMS, ETC.

Hovering changes: background imagery, typography position, cursor. Click enters the respective category.

## 35. Homepage — Scene 06: Drop Status

Example:

```
COLLECTION 001
06 PIECES
AVAILABLE UNTIL GONE
```

This section reinforces scarcity. Do not fabricate demand statistics.

## 36. Homepage — Scene 07: Archive Preview

Once future collections exist: `PAST / 001`, previous campaign image, CTA `ENTER ARCHIVE`.

For initial launch, this can remain minimal or hidden.

## 37. Collection Page

Opening section: collection identity + hero image, e.g. `COLLECTION 001` / `06 PIECES`.

Followed by: editorial visual, interactive model, unconventional product layout.

Avoid unnecessary long introductory text.

## 38. Collection Grid Behavior

For six products, suggested composition:

- Row 1: 1 large + 1 medium product
- Row 2: editorial/image break
- Row 3: 2 balanced products
- Row 4: 1 large + 1 medium product

The exact grid should respond to available photography.

## 39. Product Card

Default: image, below it `HOODIE 01`. No price.

Hover:

1. image crossfades or slides to secondary photograph
2. product name shifts subtly
3. Quick Add appears
4. cursor becomes VIEW

Click imagery → PDP. Click Quick Add → variant overlay.

## 40. Quick Add — Desktop

Appears as lightweight overlay or expansion connected to the product card.

```
HOODIE 01
COLOR
BLACK FOREST
SIZE
S M L XL
ADD TO BAG
```

Unavailable variants are visibly disabled.

## 41. Quick Add — Mobile

Do not overlay several controls on the photograph. Use a bottom sheet.

Tap `QUICK ADD` → bottom sheet enters → user chooses color, size → `ADD TO BAG`

## 42. PDP Opening Layout

Desktop: approximately `60% media / 40% product`. Media remains visually dominant but not full-screen.

Right panel contains: product name, price, short description, color, size, add to bag, wishlist, availability.

## 43. PDP Scrolling

Right product controls remain sticky through the first media sequence.

Further down: product concept, materials, fit, care, sizing, collection context. These may become editorial layouts rather than accordion-only utility sections.

## 44. PDP Media

Recommended minimum photography package per product:

1. Front product
2. Back product
3. Front model
4. Back/side model
5. Detail
6. Fabric/detail
7. Editorial shot

This should later become part of the photography brief.

## 45. Size Selection

Size options should be obvious, e.g. `XS S M L XL`

Selected: forest-green indicator or inverted treatment.

Unavailable: strike-through or reduced opacity.

CTA should not become active until required selection is made.

## 46. Size Guide

Open in: side panel (desktop) / bottom sheet (mobile).

Include: body measurements, garment measurements, fit description, model measurements. Eventually consider recommendation tooling.

## 47. Scarcity UI

Examples: `LOW STOCK`, `3 REMAIN`, `FINAL PIECES`

Use only real inventory information. Forest green may indicate availability. Muted warm red may indicate extremely limited state, but avoid conventional alarm-style ecommerce UI.

## 48. Bag

Dedicated page.

Desktop layout: cart items (left), order summary (right).

Each item: image, name, color, size, quantity, price, remove, save.

Checkout CTA clearly dominant.

## 49. Add-to-Bag Transition

On successful add:

1. Product image shrinks very slightly.
2. Bag counter updates.
3. Small confirmation appears near Bag.
4. Optional image impression moves toward bag using shared animation.

Total: less than approximately 500 ms. Never block continued browsing.

## 50. Search

Search becomes a full-screen overlay.

At initial open: large typography `SEARCH ESQUE`, input receives immediate focus.

As user types, results populate instantly:

- PRODUCTS — image + name
- CATEGORIES — Tops / Hoodies
- COLLECTIONS — Collection 001

No-result state: `NOTHING MATCHES.`

## 51. Filters

Desktop: compact horizontal control above products or side overlay.

Mobile: bottom sheet.

Filters: category, type, size, color, availability, collection, price.

Do not expose every filter simultaneously when not useful.

## 52. Account

Account pages should become more functional than editorial. Still maintain: Esque typography, dark theme, strong spacing.

Areas: ORDERS, SAVED, ADDRESSES, PROFILE, ACCESS. Future: MEMBERSHIP

## 53. Access Page — Detailed Layout

Desktop: large central password experience.

Background layers:

1. black base
2. product image layer
3. model layer
4. giant ESQUE typography
5. password UI

Garment imagery may move laterally across the viewport at different speeds.

## 54. Access UI Copy

Suggested: `ENTER ESQUE`, password field, buttons `ENTER` / `REQUEST ACCESS`.

Supporting text: `ACCESS TO CURRENT COLLECTIONS.` Avoid paragraphs explaining the system.

## 55. Request Access Form

Fields: `FIRST NAME`, `EMAIL`

Checkbox: "I agree to receive Esque emails, including access and collection updates."

CTA: `REQUEST ACCESS`

Confirmation: `ACCESS SENT.` Secondary: `CHECK YOUR EMAIL.`

## 56. Incorrect Password

Preferred animation:

1. text briefly splits horizontally
2. field shifts approximately 3–5px
3. message appears

Potential rotating microcopy: `NOT THIS ONE.` / `ACCESS DENIED.` / `TRY AGAIN.`

Avoid aggressive shaking.

## 57. Access Persistence

- General access: approximately 30 days (secure cookie or equivalent state)
- Early-drop access: separate permission state

The architecture should permit future access tiers without rebuilding routing.

## 58. Mobile Homepage

Mobile should favor strong vertical composition:

```
Hero
↓
Interactive Model
↓
Collection Statement
↓
Selected Products
↓
Categories
↓
Drop Information
```

The site should feel almost app-like while remaining web-native.

## 59. Mobile Motion

Reduce depth and pointer-dependent effects. Prefer: swipe, masked reveals, vertical transforms, image transitions, tap states.

Maintain 60 FPS on typical modern phones where practical.

## 60. Responsive Rules

Do not simply scale desktop compositions down. At breakpoints: change composition, relocate typography, modify interaction, remove unnecessary effects, reduce simultaneous animation.

## 61. Performance Budget Philosophy

Every large effect should justify its cost. Before adding WebGL, a large animation library, 3D, video, or a custom shader, ask: **Does this create meaningful Esque value?** If not, do not ship it.

## 62. Recommended Frontend Motion Stack

Preferred starting architecture:

- native CSS transitions
- CSS transforms
- View Transitions where appropriate
- Motion / Framer Motion-style library for component/layout motion
- GSAP only for complex sequences where it provides clear value
- Three.js/WebGL only for isolated high-impact features

Do not use three animation systems to solve the same problem.

## 63. Reduced Motion

When user requests reduced motion, disable/reduce: parallax, cursor inertia, large movement, scroll-linked transforms, depth effects.

Retain: fades, state changes, basic page transitions.

## 64. Loading

Images should reserve layout space before loading. Use: blurred placeholder, low-quality preview, masked reveal. Never cause large page jumps.

## 65. Placeholder Assets

Until Esque has real photography, use intentional development placeholders. Each placeholder should include `ESQUE PLACEHOLDER` and intended type, e.g. `MODEL — FULL BODY`, `PRODUCT — FRONT`, `PRODUCT — DETAIL`.

This prevents temporary stock images from accidentally defining the final design.

## 66. Photography Requirements — Future Brief

The eventual photography brief should specifically capture assets for: homepage hero, interactive model, product cards, PDP, collection hero, category imagery, social previews, email campaigns.

Interactive model photography requires controlled posing so individual garments remain visually separable.

## 67. SEO + Access Gate

The access experience must not make the entire site technically invisible.

Public product URLs should exist, e.g. `/products/hoodie-01`

Search engines should be able to access: title, description, product schema, images, collection relation, canonical URL.

The Esque access experience can be applied to human browsing without turning the catalog into an uncrawlable private application.

## 68. Design Quality Rule

Before shipping any page, evaluate:

- **Visual** — Does this look intentionally Esque?
- **Interaction** — Is every interactive element discoverable?
- **Motion** — Does movement improve the interface?
- **Commerce** — Can a customer complete the purchase without confusion?
- **Mobile** — Does it still feel premium without hover?
- **Performance** — Does it respond immediately?
- **Accessibility** — Can someone use the core interface with keyboard, screen reader and reduced motion?

## 69. V1 Signature Features

The first Esque release should be known for a few extremely polished interactions rather than dozens of average ones. Prioritize these six:

1. **Access Gate** — Memorable introduction.
2. **Interactive Model** — Signature product discovery interaction.
3. **Experimental Menu** — Typography-led navigation.
4. **Product Hover System** — Photography transforms during exploration.
5. **Shared Product Transitions** — Create continuity between collection and PDP.
6. **Collection Identity System** — Each drop feels distinct while still Esque.

These should receive the majority of interaction-development attention.

## 70. Things Esque Must Avoid

Do not use:

- excessive glassmorphism
- excessive rounded cards
- neon gradients
- generic Shopify sections
- giant announcement bars
- constant carousels
- excessive popup marketing
- slow mandatory intro screens
- gratuitous horizontal scrolling
- autoplay audio
- excessive animation
- fake scarcity
- generic luxury serif everywhere
- unnecessary 3D
- hover-only critical information
- low-contrast gray text
- multiple competing accent colors

## 71. Repository Documentation Structure

Recommended root structure:

```
CLAUDE.md

docs/
├── PRODUCT.md
├── DESIGN_SYSTEM.md
├── INTERACTIONS.md
├── ARCHITECTURE.md
├── CONTENT.md
├── DECISIONS.md
└── ROADMAP.md
```

`CLAUDE.md` stays at repository root. Supporting project documentation lives under `/docs`. This keeps the project root clean while giving every agent a predictable location.

> **Note:** this repository currently keeps `PROJECT.md` and `DESIGN_SYSTEM.md` at the root rather than under `/docs`, matching the existing `CLAUDE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md` placement already present in the repo. Revisit this if the project later adopts the `/docs` structure described above.

## 72. PRODUCT.md

Contains:

- Esque vision
- target audience
- product architecture
- categories
- drop system
- commerce requirements
- account requirements
- SEO
- email
- analytics
- feature scope

The existing Esque Product Requirements Document becomes this file.

> **Note:** in this repository, this content lives in `PROJECT.md` (not `PRODUCT.md`), matching the file this repo already had scaffolded before this documentation pass began. See DECISIONS.md.

## 73. DESIGN_SYSTEM.md

Contains:

- colors
- typography
- layout grid
- spacing
- surfaces
- buttons
- forms
- cards
- breakpoints
- responsive rules
- accessibility design rules

The visual sections of this specification become this file.

## 74. INTERACTIONS.md

Contains:

- timing
- easing
- cursor
- menu
- hover
- drag
- scroll
- interactive model
- page transitions
- mobile gestures
- reduced motion

Any developer changing animation should consult this file first.

> **Note:** this repository's [INTERACTIONS.md](./INTERACTIONS.md) fulfills this section — a consolidated motion/interaction reference citing back to the relevant sections of this file and PROJECT.md.

## 75. ARCHITECTURE.md

Recommended technology baseline:

**Commerce** — Shopify

**Storefront** — Headless React storefront

**Checkout** — Shopify Checkout

**Email** — Klaviyo

**Analytics** — Shopify Analytics + GA4 + Search Console

**Hosting** — Shopify-compatible edge hosting / Oxygen where appropriate

**Search** — Start with Shopify-native/storefront search capabilities

**Content** — Shopify products + collections + metafields/metaobjects initially

The architecture should avoid introducing additional paid infrastructure until there is a demonstrated need.

> **Note:** this repository's actual `ARCHITECTURE.md` refines this baseline — Next.js (App Router) rather than Hydrogen/Remix, and Vercel rather than Oxygen — per DECISIONS.md D-002 and D-003, confirmed with the project owner.

## 76. CONTENT.md

Defines Esque's voice.

Voice should be:

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

Bad:

> We're so excited to introduce our amazing new collection!

Better:

> COLLECTION 001
>
> AVAILABLE UNTIL GONE.

> **Note:** this repository's [CONTENT.md](./CONTENT.md) fulfills this section — a consolidated voice/copy reference citing back to the relevant sections of PROJECT.md and this file.

## 77. DECISIONS.md

Use an ADR-style record.

Example:

`D-001 — Use Shopify as commerce backend`

Reason:

Reliable inventory, checkout, payments, order management and product operations without constraining the frontend.

> **Note:** this repository's actual `DECISIONS.md` follows this exact format — see D-001 there for the real (matching) entry.

## 78. ROADMAP.md

Recommended phases:

**Phase 0** — Foundation

**Phase 1** — Design system

**Phase 2** — Commerce foundation

**Phase 3** — Core storefront

**Phase 4** — Signature interactions

**Phase 5** — Checkout/accounts/email

**Phase 6** — SEO/accessibility/performance

**Phase 7** — Launch validation

> **Note:** this repository's actual `ROADMAP.md` expands this into a more granular 12-phase build order (see §79 below) plus V1.1/V2+ tracking, rather than using this 8-phase summary directly.

## 79. Build Order

Recommended implementation sequence:

**01 — Project Foundation** — Shopify development store, headless storefront, Git repository, environment management, documentation, CI

**02 — Tokens** — colors, typography, spacing, responsive grid, base components

**03 — Shell** — global layout, navigation, full-screen menu, footer, page transitions

**04 — Commerce** — product fetching, collections, variants, inventory, cart, checkout

**05 — Catalog** — New, Tops, Bottoms, Etc., search, filters

**06 — PDP** — complete product page

**07 — Access Gate** — password, persistence, request access, Klaviyo

**08 — Homepage** — editorial scenes

**09 — Interactive Model** — hotspot system

**10 — Advanced Motion** — custom cursor, layout transitions, parallax, image reveals

**11 — Account** — profile, orders, wishlist

**12 — Optimization** — responsive polish, accessibility, SEO, analytics, testing, performance

## 80. Important Build Principle

**Build functionality before spectacular animation.**

Example — Interactive Model:

- Stage 1: hotspots work.
- Stage 2: product information works.
- Stage 3: responsive behavior works.
- Stage 4: animation is added.
- Stage 5: visual refinement.

This prevents Esque from becoming visually impressive but technically fragile.

## 81. Definition of Done

A feature is not complete simply because it visually resembles the design. It must also:

- work on desktop
- work on mobile
- work with keyboard where applicable
- support reduced motion
- handle loading
- handle errors
- handle empty state
- use real commerce state
- pass validation
- avoid console errors
- maintain acceptable performance
- contain appropriate analytics events
- have automated tests where appropriate

## 82. Esque North Star

The final experience should feel as if: **a fashion editorial became an interactive store.**

The visitor should notice the experience. The customer should not notice the complexity required to make it work.

That is the standard for Esque.
</content>
