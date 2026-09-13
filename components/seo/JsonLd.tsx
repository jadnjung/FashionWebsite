// Renders one JSON-LD <script> tag from a structured-data object. Follows
// Next.js's own documented JSON-LD pattern exactly (docs/01-app/02-guides/
// json-ld.md): a plain <script type="application/ld+json"> via
// dangerouslySetInnerHTML, with '<' escaped to its unicode equivalent —
// JSON.stringify alone does not sanitize a malicious '</script>' substring
// that could otherwise break out of the tag (e.g. via a Shopify-sourced
// product title/description). next/script is for executable JavaScript
// and is the wrong tool here; structured data is inert data, not code
// (the same doc explicitly notes this).
//
// A general HTML-sanitizer library (e.g. DOMPurify) is deliberately not
// used: this content is JSON intended to contain zero HTML, not an HTML
// fragment meant to be rendered with some tags allowed — the correct fix
// is removing every literal '<' so no character sequence can open an HTML
// tag at all, which is exactly what the replace below does, not filtering
// which tags/attributes are "safe" (DOMPurify's actual job, for a
// different kind of input than this).
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
