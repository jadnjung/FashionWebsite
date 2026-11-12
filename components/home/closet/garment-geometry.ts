import {
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RGBAFormat,
  RepeatWrapping,
} from 'three';
import type { PlaceholderShape } from '@/lib/home/closet-shape';
import {
  blurField,
  clothHalfThickness,
  drapeOffset,
  rasterizePolygon,
  sampleField,
  type Bounds,
  type Point,
} from '@/lib/home/garment-drape';

// Placeholder garments for the Collection Closet (DECISIONS.md D-089), used
// until a product has a real GLB model in Shopify. Local coordinates: x is
// centered on 0, y = 0 is the top edge where the hanger bar meets the
// garment, and the garment hangs downward (negative y).

// Each outline is the right half (x >= 0), top-center to bottom-center;
// mirrorOutline() produces the closed, symmetric silhouette. Shapes are
// drawn as clothes actually hang on a hanger: shoulders sloping with the
// bar, sleeves dropping under their own weight rather than held out.
const HALF_OUTLINES: Record<PlaceholderShape, readonly Point[]> = {
  tee: [
    [0, -0.075],
    [0.05, -0.06],
    [0.09, -0.03],
    [0.13, 0],
    [0.33, -0.07],
    [0.42, -0.14],
    [0.49, -0.27],
    [0.52, -0.36],
    [0.41, -0.41],
    [0.35, -0.33],
    [0.32, -0.5],
    [0.32, -0.75],
    [0.34, -0.99],
    [0.18, -1.0],
    [0, -1.01],
  ],
  longsleeve: [
    [0, -0.075],
    [0.05, -0.06],
    [0.09, -0.03],
    [0.13, 0],
    [0.33, -0.07],
    [0.42, -0.16],
    [0.45, -0.4],
    [0.46, -0.7],
    [0.47, -0.97],
    [0.4, -1.0],
    [0.35, -1.04],
    [0.18, -1.05],
    [0, -1.06],
  ],
  pants: [
    [0, 0],
    [0.3, 0],
    [0.33, -0.22],
    [0.33, -0.8],
    [0.32, -1.5],
    [0.17, -1.51],
    [0, -1.5],
  ],
  generic: [
    [0, -0.03],
    [0.14, 0],
    [0.3, -0.06],
    [0.36, -0.5],
    [0.38, -0.9],
    [0, -0.92],
  ],
};

// Hung garments rest with their sleeves against the body and trouser legs
// together, so those are one silhouette here; a soft groove marks where
// they meet instead of a gap. Each crease: |x| position, where it starts
// (depth 0 = top edge, 1 = hem), and how deep it cuts into the thickness.
interface Crease {
  x: number;
  fromDepth: number;
  strength: number;
}

const CREASES: Record<PlaceholderShape, readonly Crease[]> = {
  tee: [],
  longsleeve: [{ x: 0.37, fromDepth: 0.3, strength: 0.45 }],
  pants: [
    { x: 0, fromDepth: 0.28, strength: 0.5 },
    // Pressed front creases down each leg.
    { x: 0.17, fromDepth: 0.15, strength: 0.25 },
  ],
  generic: [],
};
const CREASE_WIDTH = 0.035;

function creaseFactor(kind: PlaceholderShape, x: number, depth: number): number {
  let factor = 1;
  for (const crease of CREASES[kind]) {
    if (depth < crease.fromDepth) continue;
    const ramp = Math.min(1, (depth - crease.fromDepth) / 0.08);
    const distance = (Math.abs(x) - crease.x) / CREASE_WIDTH;
    factor *= 1 - crease.strength * ramp * Math.exp(-distance * distance);
  }
  return factor;
}

function mirrorOutline(half: readonly Point[]): Point[] {
  const left = half
    .slice(1, -1)
    .reverse()
    .map(([x, y]) => [-x, y] as const);
  return [...half, ...left];
}

/** Bounding box of a silhouette. */
export function getShapeBounds(kind: PlaceholderShape): Bounds {
  const xs = HALF_OUTLINES[kind].map(([x]) => x);
  const ys = HALF_OUTLINES[kind].map(([, y]) => y);
  const halfWidth = Math.max(...xs);
  return { minX: -halfWidth, maxX: halfWidth, minY: Math.min(...ys), maxY: Math.max(...ys) };
}

// Mask resolution, texels per scene unit.
const MASK_DENSITY = 140;
// Mesh resolution relative to the mask.
const MESH_DENSITY = 0.55;
const PADDING = 0.05;
const MAX_HALF_THICKNESS = 0.05;
const MIN_HALF_THICKNESS = 0.006;
// Blur radius in texels — how far in from the edge the cloth reaches its
// full thickness (about 0.1 units after three passes at MASK_DENSITY).
const EDGE_SOFTNESS = 8;

export interface ClothGarment {
  geometry: BufferGeometry;
  /** Silhouette coverage as an alpha map (alphaMap reads the green channel). */
  alphaMap: DataTexture;
}

/**
 * Builds a placeholder garment as one closed, padded piece of cloth: front
 * and back surfaces over a grid, meeting at a soft, thin edge, with drape
 * folds that deepen toward the hem. The grid is a rectangle; the alpha map
 * (alphaTest) cuts it to the garment's exact silhouette, which keeps the
 * outline smooth without needing a constrained triangulation.
 */
export function createClothGarment(kind: PlaceholderShape, seed: number): ClothGarment {
  const polygon = mirrorOutline(HALF_OUTLINES[kind]);
  const shape = getShapeBounds(kind);
  const bounds: Bounds = {
    minX: shape.minX - PADDING,
    maxX: shape.maxX + PADDING,
    minY: shape.minY - PADDING,
    maxY: shape.maxY + PADDING,
  };
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const maskW = Math.ceil(spanX * MASK_DENSITY);
  const maskH = Math.ceil(spanY * MASK_DENSITY);

  const coverage = rasterizePolygon(polygon, bounds, maskW, maskH, 2);
  const softened = blurField(coverage, maskW, maskH, EDGE_SOFTNESS);

  const segX = Math.max(8, Math.round(maskW * MESH_DENSITY));
  const segY = Math.max(8, Math.round(maskH * MESH_DENSITY));
  const columns = segX + 1;
  const rows = segY + 1;
  const perSide = columns * rows;
  const positions = new Float32Array(perSide * 2 * 3);
  const uvs = new Float32Array(perSide * 2 * 2);
  const garmentHeight = shape.maxY - shape.minY;
  const halfWidth = shape.maxX;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const u = col / segX;
      const v = row / segY;
      const x = bounds.minX + u * spanX;
      const y = bounds.minY + v * spanY;
      const depth = (shape.maxY - y) / garmentHeight;
      // Never fully zero: front and back surfaces at the same depth z-fight,
      // letting the darker back face flicker through at edges and creases.
      const half = Math.max(
        MIN_HALF_THICKNESS,
        clothHalfThickness(sampleField(softened, maskW, maskH, u, v), MAX_HALF_THICKNESS) *
          creaseFactor(kind, x, depth),
      );
      const across = Math.max(-1, Math.min(1, x / halfWidth));
      const center = drapeOffset(x, depth, across, seed);
      const i = row * columns + col;
      positions.set([x, y, center + half], i * 3);
      positions.set([x, y, center - half], (perSide + i) * 3);
      uvs.set([u, v], i * 2);
      uvs.set([u, v], (perSide + i) * 2);
    }
  }

  const indices: number[] = [];
  for (let row = 0; row < segY; row++) {
    for (let col = 0; col < segX; col++) {
      const a = row * columns + col;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      // Front faces +z; the back surface reuses the grid with reversed
      // winding so it faces -z.
      indices.push(a, b, d, a, d, c);
      indices.push(perSide + a, perSide + d, perSide + b, perSide + a, perSide + c, perSide + d);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mask = new Uint8Array(maskW * maskH * 4);
  for (let i = 0; i < coverage.length; i++) {
    const value = Math.round(coverage[i]! * 255);
    mask.set([value, value, value, 255], i * 4);
  }
  const alphaMap = new DataTexture(mask, maskW, maskH, RGBAFormat);
  alphaMap.magFilter = LinearFilter;
  alphaMap.minFilter = LinearFilter;
  alphaMap.needsUpdate = true;

  return { geometry, alphaMap };
}

const WEAVE_SIZE = 64;
const WEAVE_THREADS = 16;

/**
 * A small tiling normal map of a fine knit/weave — the micro-texture that
 * makes a surface read as fabric rather than plastic under raking light.
 * Generated once, shared by every placeholder garment.
 */
export function createWeaveNormalMap(): DataTexture {
  const data = new Uint8Array(WEAVE_SIZE * WEAVE_SIZE * 4);
  const frequency = (Math.PI * 2 * WEAVE_THREADS) / WEAVE_SIZE;
  for (let y = 0; y < WEAVE_SIZE; y++) {
    for (let x = 0; x < WEAVE_SIZE; x++) {
      // Derivatives of a height field h = sin(fx)·|cos(fy/2)| + cos(fy)·|sin(fx/2)|
      // — alternating over/under threads.
      const dx = Math.cos(x * frequency) * Math.abs(Math.cos((y * frequency) / 2));
      const dy = -Math.sin(y * frequency) * Math.abs(Math.sin((x * frequency) / 2));
      const nx = -dx * 0.5;
      const ny = -dy * 0.5;
      const length = Math.hypot(nx, ny, 1);
      data.set(
        [
          Math.round(((nx / length) * 0.5 + 0.5) * 255),
          Math.round(((ny / length) * 0.5 + 0.5) * 255),
          Math.round(((1 / length) * 0.5 + 0.5) * 255),
          255,
        ],
        (y * WEAVE_SIZE + x) * 4,
      );
    }
  }
  const texture = new DataTexture(data, WEAVE_SIZE, WEAVE_SIZE, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(10, 14);
  // Mipmapped: without it the fine weave aliases into visible stripes once
  // a garment is only a few hundred pixels tall.
  texture.generateMipmaps = true;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}
