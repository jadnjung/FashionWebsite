'use client';

import { useLoader } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react';
import {
  Box3,
  CatmullRomCurve3,
  Color,
  Group,
  ImageLoader,
  MeshDepthMaterial,
  RGBADepthPacking,
  TubeGeometry,
  Vector2,
  Vector3,
  type DataTexture,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  createClothGarment,
  createWeaveNormalMap,
  getShapeBounds,
} from '@/components/home/closet/garment-geometry';
import { getGarmentTextureUrl, type PlaceholderShape } from '@/lib/home/closet-shape';
import { fitModelToHanger } from '@/lib/home/closet-model';
import { pickDominantColor, rgbToHex } from '@/lib/home/garment-color';
import { seedFromString } from '@/lib/home/garment-drape';
import type { ClosetProduct } from '@/lib/shopify/products';

// Where the garment's top edge sits below the rod (scene units) — the
// hanger hook and shoulder bar fill the gap.
export const GARMENT_TOP_Y = -0.16;
// A real GLB is scaled to fit this box, matching the placeholders' scale.
const MODEL_MAX_WIDTH = 1.0;
const MODEL_MAX_HEIGHT = 1.2;

// Neutral charcoal for a garment with no swatch and no readable photo.
const FALLBACK_FABRIC = '#3a3936';
// Photos are downscaled to this many pixels square before color picking.
const COLOR_SAMPLE_SIZE = 48;

const WEAVE_NORMAL_SCALE = new Vector2(0.25, 0.25);
let sharedWeave: DataTexture | null = null;
function getWeaveNormalMap(): DataTexture {
  sharedWeave ??= createWeaveNormalMap();
  return sharedWeave;
}

/** Hanging height of a garment, used to center it in the focused view. */
export function getGarmentHeight(product: ClosetProduct, shape: PlaceholderShape): number {
  if (product.modelUrl) return MODEL_MAX_HEIGHT;
  const { minY, maxY } = getShapeBounds(shape);
  return maxY - minY;
}

interface ClosetGarmentProps {
  product: ClosetProduct;
  shape: PlaceholderShape;
}

/**
 * One garment on its hanger. Renders the product's real GLB when Shopify
 * has one; otherwise — or if that model fails to load — a placeholder
 * garment of soft, draped cloth in the product's color (DECISIONS.md
 * D-089).
 */
export function ClosetGarment({ product, shape }: ClosetGarmentProps) {
  const placeholder = <PlaceholderGarment product={product} shape={shape} />;
  return (
    <>
      <Hanger shape={product.modelUrl ? 'generic' : shape} />
      {product.modelUrl ? (
        <GarmentErrorBoundary fallback={placeholder} label={product.handle}>
          <Suspense fallback={null}>
            <ModelGarment url={product.modelUrl} />
          </Suspense>
        </GarmentErrorBoundary>
      ) : (
        placeholder
      )}
    </>
  );
}

function ModelGarment({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  // Fitted once, on a fresh clone measured in its own coordinates — before
  // it is mounted under the rail, whose transform would otherwise leak into
  // the bounding box (useLoader also caches by URL, so the shared scene is
  // never mutated).
  const model = useMemo<Object3D>(() => {
    const content = gltf.scene.clone(true);
    content.updateMatrixWorld(true);
    const box = new Box3().setFromObject(content);
    const fit = fitModelToHanger(
      box.min,
      box.max,
      MODEL_MAX_WIDTH,
      MODEL_MAX_HEIGHT,
      GARMENT_TOP_Y,
    );
    const wrapper = new Group();
    wrapper.add(content);
    wrapper.scale.setScalar(fit.scale);
    wrapper.position.set(fit.offset.x, fit.offset.y, fit.offset.z);
    wrapper.traverse((node) => {
      node.castShadow = true;
      node.receiveShadow = true;
    });
    return wrapper;
  }, [gltf]);

  return <primitive object={model} />;
}

/**
 * Fabric color, in order of trust: the merchant's Shopify color swatch;
 * otherwise the dominant color of the product photo's center; otherwise a
 * neutral charcoal.
 */
function PlaceholderGarment({ product, shape }: ClosetGarmentProps) {
  const seed = seedFromString(product.handle);
  if (product.fabricColor)
    return <ClothGarment shape={shape} color={product.fabricColor} seed={seed} />;
  const imageUrl = product.image ? getGarmentTextureUrl(product.image.url) : null;
  const neutral = <ClothGarment shape={shape} color={FALLBACK_FABRIC} seed={seed} />;
  if (!imageUrl) return neutral;
  // A photo that fails to load degrades to the neutral fabric. No Suspense
  // boundary of its own: photos suspend the closet's outer boundary, so the
  // canvas fades in with every garment already in its color (a slow GLB,
  // by contrast, pops in on its own).
  return (
    <GarmentErrorBoundary fallback={neutral} label={product.handle}>
      <PhotoColoredGarment imageUrl={imageUrl} shape={shape} seed={seed} />
    </GarmentErrorBoundary>
  );
}

function PhotoColoredGarment({
  imageUrl,
  shape,
  seed,
}: {
  imageUrl: string;
  shape: PlaceholderShape;
  seed: number;
}) {
  const image = useLoader(ImageLoader, imageUrl);
  const color = useMemo(() => getPhotoFabricColor(image), [image]);
  return <ClothGarment shape={shape} color={color} seed={seed} />;
}

/**
 * Dominant color of the photo's central region, where the garment sits.
 * Falls back to neutral fabric if the image can't be read (e.g. a CDN
 * response without CORS headers taints the canvas).
 */
function getPhotoFabricColor(image: HTMLImageElement): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = COLOR_SAMPLE_SIZE;
    canvas.height = COLOR_SAMPLE_SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return FALLBACK_FABRIC;
    context.drawImage(image, 0, 0, COLOR_SAMPLE_SIZE, COLOR_SAMPLE_SIZE);
    const { data } = context.getImageData(0, 0, COLOR_SAMPLE_SIZE, COLOR_SAMPLE_SIZE);
    const rgb = pickDominantColor(data, COLOR_SAMPLE_SIZE, COLOR_SAMPLE_SIZE);
    return rgb ? rgbToHex(rgb) : FALLBACK_FABRIC;
  } catch {
    return FALLBACK_FABRIC;
  }
}

function ClothGarment({
  shape,
  color,
  seed,
}: {
  shape: PlaceholderShape;
  color: string;
  seed: number;
}) {
  const cloth = useMemo(() => createClothGarment(shape, seed), [shape, seed]);
  // Shadows must respect the silhouette cut-out too, or each garment would
  // cast a rectangular shadow.
  const depthMaterial = useMemo(
    () =>
      new MeshDepthMaterial({
        depthPacking: RGBADepthPacking,
        alphaMap: cloth.alphaMap,
        alphaTest: 0.5,
      }),
    [cloth],
  );
  // Fabric's soft, velvety rim highlight: a lighter tint of its own color.
  // Kept to a light touch on dark fabric: a strong pale sheen washes black
  // cloth out to grey.
  const sheenColor = useMemo(() => {
    const base = new Color(color);
    const lightness = base.getHSL({ h: 0, s: 0, l: 0 }).l;
    return base.lerp(new Color('#ffffff'), 0.08 + 0.22 * lightness);
  }, [color]);

  useEffect(
    () => () => {
      cloth.geometry.dispose();
      cloth.alphaMap.dispose();
      depthMaterial.dispose();
    },
    [cloth, depthMaterial],
  );

  return (
    <mesh
      geometry={cloth.geometry}
      position={[0, GARMENT_TOP_Y, 0]}
      customDepthMaterial={depthMaterial}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={color}
        roughness={0.88}
        sheen={0.7}
        sheenRoughness={0.6}
        sheenColor={sheenColor}
        alphaMap={cloth.alphaMap}
        alphaTest={0.5}
        // Smooths the cut-out silhouette edge using the canvas's MSAA.
        alphaToCoverage
        normalMap={getWeaveNormalMap()}
        normalScale={WEAVE_NORMAL_SCALE}
      />
    </mesh>
  );
}

const HOOK_POINTS = [
  new Vector3(0, -0.15, 0),
  new Vector3(0, -0.07, 0),
  new Vector3(-0.035, 0.0, 0),
  new Vector3(0, 0.055, 0),
  new Vector3(0.045, 0.015, 0),
  new Vector3(0.04, -0.015, 0),
];

/** A wooden hanger with a polished metal hook. */
function Hanger({ shape }: { shape: PlaceholderShape }) {
  const hook = useMemo(() => new TubeGeometry(new CatmullRomCurve3(HOOK_POINTS), 32, 0.008, 8), []);
  const bar = useMemo(() => {
    const points =
      shape === 'pants'
        ? [new Vector3(-0.38, -0.15, 0), new Vector3(0.38, -0.15, 0)]
        : [
            new Vector3(-0.46, -0.25, 0),
            new Vector3(-0.22, -0.18, 0),
            new Vector3(0, -0.15, 0),
            new Vector3(0.22, -0.18, 0),
            new Vector3(0.46, -0.25, 0),
          ];
    return new TubeGeometry(new CatmullRomCurve3(points), 32, 0.02, 10);
  }, [shape]);

  return (
    <group>
      <mesh geometry={hook} castShadow>
        <meshStandardMaterial color="#b4b4ad" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh geometry={bar} castShadow>
        <meshStandardMaterial color="#6e5a45" roughness={0.55} />
      </mesh>
    </group>
  );
}

interface GarmentErrorBoundaryProps {
  fallback: ReactNode;
  label: string;
  children: ReactNode;
}

/**
 * A broken or unreachable GLB must never take the whole closet down — the
 * failing garment alone falls back to its placeholder.
 */
class GarmentErrorBoundary extends Component<GarmentErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(
      `[home] Collection Closet: asset for "${this.props.label}" failed to load, using a fallback.`,
      error,
    );
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
