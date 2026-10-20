// Single source of truth for the branded 404 copy (CONTENT.md §6:
// "THIS PIECE DOESN'T EXIST."), shared between two different renderers that
// both need to show it:
//
// 1. app/not-found.tsx — the React `not-found` boundary Next.js renders for
//    a genuinely-unmatched route, and for any case Proxy doesn't intercept.
// 2. proxy.ts — a terminal, hand-written HTML response for a recognized
//    category with an unrecognized subcategory (e.g. /tops/not-a-real-one),
//    returned before Next's own rendering pipeline ever starts. See
//    DECISIONS.md D-072 for why this exists as a second renderer at all
//    (notFound() inside a dynamically-rendered page cannot commit a real
//    HTTP 404 status) rather than a change to app/not-found.tsx itself.
//
// The two renderers necessarily produce different markup (JSX styled by
// Tailwind's compiled stylesheet vs. a hand-written, inline-styled HTML
// string — Proxy has no access to the compiled CSS, see D-072) — but the
// customer-facing *text* must never drift between them, which is the one
// thing this module guarantees.
export const NOT_FOUND_TITLE = 'Not Found — Esque';
export const NOT_FOUND_DESCRIPTION = "This piece doesn't exist.";
export const NOT_FOUND_HEADING = "THIS PIECE DOESN'T EXIST.";
export const NOT_FOUND_HOME_LABEL = 'ESQUE';
