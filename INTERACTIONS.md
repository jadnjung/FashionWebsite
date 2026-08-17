# Esque — Interactions & Motion Specification

Purpose: animation timing, easing, cursor behavior, transitions, hover, gestures, and the interactive model — the single reference for anyone changing motion on Esque. Per [DESIGN_SYSTEM.md §74](./DESIGN_SYSTEM.md#74-interactionsmd), any developer changing animation should consult this file first.

This document consolidates motion/interaction rules that live in [PROJECT.md](./PROJECT.md) and [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — each section below cites its source of truth. When in doubt, the cited section is authoritative; this file exists to make the motion system easy to find in one place, not to replace those docs.

## 1. Motion Philosophy

Esque should use fast responsive motion, not slow theatrical animation everywhere. Motion exists to: explain hierarchy, reinforce interaction, create continuity, establish brand identity, produce surprise, increase perceived quality. Motion must not obstruct shopping.

Target intensity: approximately 7/10 visually, but approximately 3/10 interaction complexity — the site should look sophisticated while remaining simple to operate.

Motion should feel **fast, controlled, physical and intentional** — not floaty, slow, whimsical, or overly elastic.

Source: [PROJECT.md §62–63](./PROJECT.md#62-motion-philosophy), [DESIGN_SYSTEM.md §19](./DESIGN_SYSTEM.md#19-motion-personality)

## 2. The Interaction Rule — when an animation is justified

Every major animation must satisfy at least one of these, or it should be removed:

1. Improve comprehension.
2. Communicate state.
3. Connect two interface states.
4. Reinforce Esque's identity.
5. Produce meaningful delight.

Source: [PROJECT.md §66](./PROJECT.md#66-interaction-rule)

## 3. Motion Timing

| Tier | Duration | Used for |
|---|---|---|
| Micro | 120–200 ms | icon state, underline, button feedback |
| Standard UI | 200–350 ms | filter, menu item, quick add |
| Layout | 350–500 ms | card expansion, navigation transformation |
| Editorial | 500–800 ms | hero transition, collection entrance, major shared image transition |

Do not routinely exceed 800 ms.

PROJECT.md's own summary uses slightly coarser bands for the same idea — Microinteraction (100–250 ms: buttons, hover, icons, navigation states), UI Transitions (250–450 ms: menus, filters, quick add, product states), Editorial Transitions (400–800 ms: collection entrances, major image transitions, homepage scenes). Treat the table above (from DESIGN_SYSTEM.md) as the more granular reference; both agree motion should never routinely run multiple seconds.

Source: [DESIGN_SYSTEM.md §21](./DESIGN_SYSTEM.md#21-motion-timing), [PROJECT.md §64](./PROJECT.md#64-motion-system)

## 4. Easing

Standard easing: `cubic-bezier(0.22, 1, 0.36, 1)` — use for reveals, menus, page transitions, product expansion.

Short microinteractions: `ease-out`.

Avoid uncontrolled spring effects throughout the site. Physics-based easing may be used specifically for drag interactions.

Source: [DESIGN_SYSTEM.md §20](./DESIGN_SYSTEM.md#20-motion-curves)

## 5. Approved Interaction Techniques

Use selectively: image masks, clip reveals, subtle scale, parallax, cursor proximity, magnetic interactions, layout morphing, shared-element page transitions, drag interactions, inertial movement, animated typography, image displacement, depth transforms, subtle WebGL effects where justified.

Source: [PROJECT.md §65](./PROJECT.md#65-approved-interaction-techniques)

## 6. Hover

Hover should communicate responsiveness.

Preferred: image change, small positional movement, typography shift, masking, scale around 1.01–1.03, opacity changes, cursor label.

Avoid: giant scaling, excessive bouncing, glowing neon borders, gimmicky rotations.

Source: [DESIGN_SYSTEM.md §18](./DESIGN_SYSTEM.md#18-hover-philosophy)

## 7. Custom Cursor

Desktop only.

Default: small circular cursor or precise dot, `8px` diameter. Interactive mode expands to approximately `48–72px`; text inside may become `VIEW`, `SHOP`, `DRAG`, `OPEN`, `NEXT`.

The cursor follows movement with extremely light interpolation — lag must remain low; disable interpolation if it feels delayed.

**Accessibility rule:** do not hide the OS cursor until the custom cursor has initialized successfully. Disable the custom cursor for touch, reduced-motion users if appropriate, low-performance devices, and form inputs where precision matters.

Source: [DESIGN_SYSTEM.md §22–23](./DESIGN_SYSTEM.md#22-custom-cursor), [PROJECT.md §67](./PROJECT.md#67-cursor)

## 8. Magnetic Effects

Selective controls may respond slightly to cursor proximity — good candidates: hero CTA, View Product, menu items, collection navigation.

Movement should remain restrained; buttons should not visibly escape the user's cursor.

Source: [PROJECT.md §68](./PROJECT.md#68-magnetic-effects)

## 9. Menu Transition

Opening: (1) background mask expands, (2) navigation typography enters vertically, (3) editorial imagery fades/reveals, (4) utility navigation appears. Total duration approximately 350–500 ms. Closing should be slightly faster.

Source: [DESIGN_SYSTEM.md §26](./DESIGN_SYSTEM.md#26-menu-transition)

## 10. Page Transitions

Navigation should feel continuous — e.g. Collection card → Collection page, Product card → Product page, Interactive garment → Product page. Preferred technique: shared imagery / typography transitions. Transitions must degrade gracefully and must never prevent navigation.

Source: [PROJECT.md §69](./PROJECT.md#69-page-transitions)

## 11. Access Gate Motion

Sequence: (1) black screen, (2) ESQUE typography enters, (3) garment image crosses behind the typography, (4) additional garments move at different depths, (5) user cursor subtly affects their movement, (6) access interface resolves into view. Motion must remain quick — never an obstacle for returning users.

**Incorrect password:** text briefly splits horizontally, field shifts approximately 3–5px, message appears. Avoid aggressive shaking.

Source: [PROJECT.md §14](./PROJECT.md#14-access-gate-motion-concept), [DESIGN_SYSTEM.md §56](./DESIGN_SYSTEM.md#56-incorrect-password)

## 12. Homepage Scene Transitions

Hero first load: (1) black screen already present, (2) main campaign image reveals using mask, (3) collection identifier appears, (4) ESQUE typography resolves, (5) navigation fades in. Total approximately 600–900 ms — no multi-second splash screen.

Subtle mouse movement creates depth between typography, model, and background on the hero (Scene 01); movement should stay within a few pixels.

Source: [DESIGN_SYSTEM.md §27–28](./DESIGN_SYSTEM.md#27-homepage--scene-01-collection-hero)

## 13. Interactive Model

Hovering a garment: the garment remains normally exposed or slightly brightens; the surrounding outfit reduces toward approximately 35–50% visual emphasis; product name/category/sizes/colors may appear; `VIEW` / `QUICK ADD` become available.

Highlight technique: masked luminance/exposure treatment, not an obvious glow or outline.

Hotspots should approximately follow garment silhouettes (SVG masks, polygon hit regions, image masks) rather than rectangular boxes or tiny manually positioned circles.

Selecting a garment uses a shared visual transition into the PDP rather than a hard page refresh: the area around the garment enlarges and the model image transforms toward the product detail layout.

Mobile: tap a garment → other garments darken → selected item highlights → product info appears → a second tap opens the product or adds it to bag. Discoverability must be obvious without hover.

Source: [DESIGN_SYSTEM.md §29–31](./DESIGN_SYSTEM.md#29-homepage--scene-02-interactive-model), [PROJECT.md §27–30](./PROJECT.md#27-interactive-model--desktop)

## 14. Product & Commerce Transitions

- **Product card hover:** image crossfades/slides to a secondary photograph, product name shifts subtly, Quick Add appears, cursor becomes `VIEW`.
- **Add-to-Bag:** product image shrinks very slightly, Bag counter updates, small confirmation appears near Bag, optional image impression moves toward the bag using a shared animation. Total under approximately 500 ms; never blocks continued browsing.
- **Quick Add:** desktop uses a lightweight overlay/expansion connected to the product card; mobile uses a bottom sheet, never several overlaid controls on the photograph.

Source: [DESIGN_SYSTEM.md §39–41, §49](./DESIGN_SYSTEM.md#39-product-card)

## 15. Drag Interactions

Use only where users naturally understand it — campaign gallery, product media carousel, collection editorial strip, future lookbook. Always provide a non-drag alternative.

Source: [PROJECT.md §70](./PROJECT.md#70-drag-interactions)

## 16. Mobile Gestures

Desktop hover interactions translate into tap interactions; drag becomes swipe. Mobile should reduce depth and pointer-dependent effects, preferring: swipe, masked reveals, vertical transforms, image transitions, tap states. Maintain 60 FPS on typical modern phones where practical.

Source: [PROJECT.md §72](./PROJECT.md#72-mobile-philosophy), [DESIGN_SYSTEM.md §59](./DESIGN_SYSTEM.md#59-mobile-motion)

## 17. Reduced Motion

When a user requests reduced motion, disable/reduce: parallax, cursor inertia, large movement, scroll-linked transforms, depth effects. Retain: fades, state changes, basic page transitions.

The ability to shop must never depend on advanced animation support — this applies across all progressive-enhancement tiers (high-powered device: full experience; low-powered device: simplified effects; reduced-motion setting: reduced animation; weak network: optimized image quality and progressive content).

Source: [DESIGN_SYSTEM.md §63](./DESIGN_SYSTEM.md#63-reduced-motion), [PROJECT.md §77](./PROJECT.md#77-progressive-enhancement)

## 18. Recommended Frontend Motion Stack

Preferred starting architecture:

- native CSS transitions
- CSS transforms
- View Transitions where appropriate
- Motion / Framer Motion-style library for component/layout motion
- GSAP only for complex sequences where it provides clear value
- Three.js/WebGL only for isolated high-impact features

Do not use three animation systems to solve the same problem — see [DECISIONS.md D-006](./DECISIONS.md#d-006--layered-motion-stack-not-one-animation-library-for-everything).

Source: [DESIGN_SYSTEM.md §62](./DESIGN_SYSTEM.md#62-recommended-frontend-motion-stack)

## 19. Performance Budget for Motion

Every large effect should justify its cost. Before adding WebGL, a large animation library, 3D, video, or a custom shader, ask: **does this create meaningful Esque value?** If not, do not ship it.

Source: [DESIGN_SYSTEM.md §61](./DESIGN_SYSTEM.md#61-performance-budget-philosophy)
</content>
