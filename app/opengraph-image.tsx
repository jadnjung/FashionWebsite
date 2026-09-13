import { ImageResponse } from 'next/og';

// Sitewide default Open Graph image (file-based convention — applies to
// every route that doesn't define its own more specific opengraph-image,
// none of which exist yet). No real product/campaign photography exists
// (PROJECT.md §101) — rather than omit og:image entirely (a blank/missing
// preview on every share) or fabricate a fake product photo (this
// project's established placeholder-honesty standard, e.g. DECISIONS.md
// D-032/D-034), this renders a plain, honest brand card from the same
// real design tokens already in DESIGN_SYSTEM.md §4 (black background,
// off-white wordmark, one restrained forest accent per §5's "5% forest"
// rule) — genuinely presentable, permanent content, not a development
// stand-in that needs a "PLACEHOLDER" label. See DECISIONS.md D-052.
//
// Deliberately no custom font: next/og's ImageResponse (Satori) needs
// font files loaded explicitly as bytes — this project's self-hosted
// next/font/google files aren't available in that form without new
// font-loading plumbing with no other consumer, which a one-off share
// image doesn't justify (CLAUDE.md's YAGNI guidance, the same reasoning
// D-029 already applied to a different feature). Satori's default sans
// renders the plain uppercase wordmark correctly.
export const alt = 'Esque';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 140,
          fontWeight: 600,
          letterSpacing: -4,
          color: '#F3F1EA',
        }}
      >
        ESQUE
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 32,
          width: 72,
          height: 4,
          backgroundColor: '#1F3D2B',
        }}
      />
    </div>,
    { ...size },
  );
}
