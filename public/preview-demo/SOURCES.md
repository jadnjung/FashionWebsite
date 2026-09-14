# public/preview-demo/ — Source & Licensing Manifest

These eight JPEGs back Demo Mode (`PREVIEW_DEMO_MODE=1`) — see
[`lib/shopify/preview-demo-fixtures.ts`](../../lib/shopify/preview-demo-fixtures.ts)'s
file header and [DECISIONS.md D-057](../../DECISIONS.md) for what Demo
Mode is, why it exists, and how it's scoped (opt-in, off by default
everywhere). This manifest exists so their provenance and license basis
stay traceable, matching this project's own documentation rigor for
sourced content — DECISIONS.md and CONTENT.md cite sources throughout;
image assets get the same treatment here.

## License

All eight images are sourced from Unsplash. Verified directly against
Unsplash's current license terms (fetched 2026-09-14 — not assumed from
training data):

- Free for commercial and non-commercial use, no permission or attribution
  required. Unsplash's own wording (unsplash.com/license): usable "for
  free, including for commercial purposes, without permission from or
  attributing the photographer or Unsplash."
- Two restrictions exist, neither triggered by this usage: images can't be
  **sold** without significant modification, and photos can't be compiled
  to **replicate a similar or competing (stock-photo) service**. Esque
  embeds these as ordinary site imagery under an opt-in preview flag —
  it does neither.

**Separate from the copyright license — recognizable people.** Unsplash's
license grants rights to the _photograph_; it does not clear the rights of
people _depicted in_ a photograph. Per Unsplash's own Help Center: "you
are solely responsible to ensure that your use of the images does not
violate or infringe third parties' rights, such as ... individuals
depicted in the images, and obtain any necessary permissions from these
third parties," and a model release exists specifically to permit "the
use of [a person's] likeness for commercial purposes (to sell, promote, or
endorse a product)." **Six of these eight files show a clearly
identifiable human face** (see table below, confirmed by viewing each
file directly, not assumed from filenames). Using a person's likeness to
dress up a commerce-adjacent site's imagery sits close to the "promote a
product" case model releases exist for — even though Esque's use here is
Demo-Mode-only and off by default, which meaningfully narrows but does not
zero out the residual consideration.

**Do not use these specific files — or this Unsplash-sourced-stock-photo
approach generally — beyond the narrow, off-by-default local/preview
scope Demo Mode is designed for.** Never in production, and never on a
publicly-reachable or externally-shared deployment (including a Vercel
Preview URL with `PREVIEW_DEMO_MODE=1` set and shared outside the team),
without first independently confirming rights coverage for the people
depicted or replacing the images with properly cleared photography. See
[DECISIONS.md D-057](../../DECISIONS.md) for the full reasoning.

## Known gap: exact per-photo source URLs were not recorded at download time

These files' individual Unsplash photo IDs/URLs were not captured when
they were downloaded, and — checked directly before writing this
manifest, not assumed absent — none of the eight JPEGs carry recoverable
provenance metadata: `sips -g all` shows only standard color-profile/pixel
data (no artist/creator/source fields), and a raw byte-level scan of each
file (`strings <file> | grep -i "unsplash\|creator\|source\|http"`) found
no embedded URLs, credit lines, or photo IDs in any of the eight. The
general source (Unsplash) and the license basis above are established and
verified; the _specific_ photo/photographer per file is not recorded and
could not be reconstructed for this manifest — guessing a matching
Unsplash URL from the image content was deliberately not attempted, since
a wrong guess would be confidently-fabricated provenance, worse than an
honestly-disclosed gap.

**Going forward: any image added to this directory (or under this same
convention elsewhere) must have its Unsplash photo URL recorded in the
table below at download time.** Retroactively sourcing these eight is not
planned — the gap is disclosed rather than backfilled with guesses.

## Files

| File             | Dimensions | Depicts                                                                      | Identifiable face?          |
| ---------------- | ---------- | ---------------------------------------------------------------------------- | --------------------------- |
| `hero.jpg`       | 1920×1080  | Cropped campaign/editorial shot — coat, hand, jewelry against a brick facade | No — cropped below the neck |
| `model-full.jpg` | 900×1125   | Full-body studio portrait — black crop top and wide-leg trousers             | **Yes**                     |
| `product-1.jpg`  | 900×1125   | Cropped detail shot — linen trousers, bare feet, hands                       | No — cropped, no face       |
| `product-2.jpg`  | 900×1125   | Flat-lay/still-life — velvet jacket and trousers on a chair, no person       | No — no person depicted     |
| `product-3.jpg`  | 900×1125   | Studio portrait — beige knit sweater                                         | **Yes**                     |
| `product-4.jpg`  | 900×1125   | Full-body street-style shot — tailored suit set                              | **Yes**                     |
| `product-5.jpg`  | 900×1125   | Studio portrait — black knit dress                                           | **Yes**                     |
| `product-6.jpg`  | 900×1125   | Studio portrait — layered top with necklaces                                 | **Yes**                     |

All eight are standard, non-corrupted baseline JPEGs (sRGB, except
`product-6.jpg` which is Adobe RGB), confirmed via `sips -g all` before
writing this manifest. The image-optimizer decode failure Demo Mode
originally surfaced ("isn't a valid image... received null") turned out
to have a different, unrelated root cause — not a problem with these
files — see [DECISIONS.md D-057](../../DECISIONS.md).
