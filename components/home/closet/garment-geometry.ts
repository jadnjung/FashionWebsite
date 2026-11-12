import { BufferAttribute, ExtrudeGeometry, Shape, ShapeGeometry, type BufferGeometry } from 'three';
import type { PlaceholderShape } from '@/lib/home/closet-shape';

// Placeholder garment silhouettes for the Collection Closet (DECISIONS.md
// D-089), used until a product has a real GLB model in Shopify. Local
// coordinates: x is centered on 0, y = 0 is the top edge where the hanger
// bar meets the garment, and the garment hangs downward (negative y).
// Roughly one scene unit wide so every garment fits HANGER_SPACING.

type Point = readonly [number, number];

// Each outline is the right half (x >= 0), top-center to bottom-center;
// mirrorOutline() produces the closed, symmetric silhouette.
const HALF_OUTLINES: Record<PlaceholderShape, readonly Point[]> = {
  tee: [
    [0, -0.08],
    [0.08, -0.04],
    [0.14, 0],
    [0.36, -0.06],
    [0.56, -0.3],
    [0.44, -0.42],
    [0.34, -0.32],
    [0.35, -1.0],
    [0, -1.0],
  ],
  longsleeve: [
    [0, -0.08],
    [0.08, -0.04],
    [0.14, 0],
    [0.36, -0.06],
    [0.5, -0.24],
    [0.54, -1.02],
    [0.42, -1.02],
    [0.39, -0.4],
    [0.36, -0.36],
    [0.36, -1.06],
    [0, -1.06],
  ],
  pants: [
    [0, 0],
    [0.32, 0],
    [0.37, -0.5],
    [0.38, -1.5],
    [0.07, -1.5],
    [0.02, -0.5],
    [0, -0.44],
  ],
  generic: [
    [0, 0],
    [0.3, 0],
    [0.38, -0.9],
    [0, -0.9],
  ],
};

function mirrorOutline(half: readonly Point[]): Point[] {
  const left = half
    .slice(1, -1)
    .reverse()
    .map(([x, y]) => [-x, y] as const);
  return [...half, ...left];
}

function buildShape(kind: PlaceholderShape): Shape {
  const points = mirrorOutline(HALF_OUTLINES[kind]);
  const shape = new Shape();
  const [first, ...rest] = points;
  shape.moveTo(first[0], first[1]);
  for (const [x, y] of rest) shape.lineTo(x, y);
  shape.closePath();
  return shape;
}

export const GARMENT_DEPTH = 0.1;

/** Bounding box of a silhouette, for cover-fitting the product photo. */
export function getShapeBounds(kind: PlaceholderShape) {
  const xs = HALF_OUTLINES[kind].map(([x]) => x);
  const ys = HALF_OUTLINES[kind].map(([, y]) => y);
  const halfWidth = Math.max(...xs);
  return { minX: -halfWidth, maxX: halfWidth, minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/**
 * The garment's body: an extruded, bevelled silhouette so it reads as a
 * soft, thick piece of fabric from every angle while it rotates.
 */
export function createGarmentBodyGeometry(kind: PlaceholderShape): BufferGeometry {
  const geometry = new ExtrudeGeometry(buildShape(kind), {
    depth: GARMENT_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 4,
  });
  // Center the extrusion on z = 0 so the garment rotates about its middle.
  geometry.translate(0, 0, -GARMENT_DEPTH / 2);
  return geometry;
}

/**
 * The front face that carries the product photo, sitting just proud of the
 * body's bevel. ShapeGeometry's default UVs are raw shape coordinates, so
 * they are remapped here to a "cover" fit of an image with the given aspect
 * ratio (width / height) — the photo fills the silhouette without
 * stretching, cropped evenly on the overflowing axis.
 */
export function createGarmentFrontGeometry(
  kind: PlaceholderShape,
  imageAspect: number,
): BufferGeometry {
  const geometry = new ShapeGeometry(buildShape(kind), 4);
  const { minX, maxX, minY, maxY } = getShapeBounds(kind);
  const shapeWidth = maxX - minX;
  const shapeHeight = maxY - minY;
  const shapeAspect = shapeWidth / shapeHeight;

  // Fraction of the image visible on each axis under cover-fit.
  const visibleU = imageAspect > shapeAspect ? shapeAspect / imageAspect : 1;
  const visibleV = imageAspect > shapeAspect ? 1 : imageAspect / shapeAspect;

  const position = geometry.getAttribute('position');
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const u = (position.getX(i) - minX) / shapeWidth;
    const v = (position.getY(i) - minY) / shapeHeight;
    uv[i * 2] = (1 - visibleU) / 2 + u * visibleU;
    uv[i * 2 + 1] = (1 - visibleV) / 2 + v * visibleV;
  }
  geometry.setAttribute('uv', new BufferAttribute(uv, 2));
  geometry.translate(0, 0, GARMENT_DEPTH / 2 + 0.031);
  return geometry;
}
