'use client';

import { useLoader } from '@react-three/fiber';
import { Component, Suspense, useLayoutEffect, useMemo, type ReactNode } from 'react';
import {
  Box3,
  CatmullRomCurve3,
  Color,
  SRGBColorSpace,
  TextureLoader,
  TubeGeometry,
  Vector3,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  createGarmentBodyGeometry,
  createGarmentFrontGeometry,
  getShapeBounds,
} from '@/components/home/closet/garment-geometry';
import { getGarmentTextureUrl, type PlaceholderShape } from '@/lib/home/closet-shape';
import type { ClosetProduct } from '@/lib/shopify/products';

// Where the garment's top edge sits below the rod (scene units) — the
// hanger hook and shoulder bar fill the gap.
export const GARMENT_TOP_Y = -0.16;
// A real GLB is scaled to fit this box, matching the placeholders' scale.
const MODEL_MAX_WIDTH = 1.0;
const MODEL_MAX_HEIGHT = 1.2;

const FALLBACK_FABRIC = '#2b2b28';

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
 * has one; otherwise — or if that model fails to load — the placeholder
 * silhouette with the product photo on its front (DECISIONS.md D-089).
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
  // useLoader caches by URL — clone so this instance's transform never
  // mutates the shared cached scene.
  const model = useMemo<Object3D>(() => gltf.scene.clone(true), [gltf]);

  useLayoutEffect(() => {
    model.position.set(0, 0, 0);
    model.scale.setScalar(1);
    model.updateMatrixWorld(true);
    const size = new Box3().setFromObject(model).getSize(new Vector3());
    const scale = Math.min(MODEL_MAX_WIDTH / (size.x || 1), MODEL_MAX_HEIGHT / (size.y || 1));
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model);
    const center = box.getCenter(new Vector3());
    // Top-center of the model meets the hanger bar.
    model.position.set(-center.x, GARMENT_TOP_Y - box.max.y, -center.z);
  }, [model]);

  return <primitive object={model} />;
}

function PlaceholderGarment({ product, shape }: ClosetGarmentProps) {
  const imageUrl = product.image ? getGarmentTextureUrl(product.image.url) : null;
  const plain = <PlainPlaceholder shape={shape} />;
  if (!imageUrl) return plain;
  // A photo that fails to load degrades to the untextured silhouette. No
  // Suspense boundary of its own: photos suspend the closet's outer
  // boundary, so the canvas fades in with every placeholder already
  // dressed (a slow GLB, by contrast, pops in on its own).
  return (
    <GarmentErrorBoundary fallback={plain} label={product.handle}>
      <TexturedPlaceholder imageUrl={imageUrl} shape={shape} />
    </GarmentErrorBoundary>
  );
}

function TexturedPlaceholder({ imageUrl, shape }: { imageUrl: string; shape: PlaceholderShape }) {
  const loaded = useLoader(TextureLoader, imageUrl);
  // useLoader caches by URL — configure a clone rather than the shared
  // cached texture.
  const texture = useMemo(() => {
    const clone = loaded.clone();
    clone.colorSpace = SRGBColorSpace;
    clone.anisotropy = 4;
    clone.needsUpdate = true;
    return clone;
  }, [loaded]);
  const image = texture.image as HTMLImageElement | undefined;
  const aspect = image && image.height > 0 ? image.width / image.height : 1;

  const body = useMemo(() => createGarmentBodyGeometry(shape), [shape]);
  const front = useMemo(() => createGarmentFrontGeometry(shape, aspect), [shape, aspect]);
  const fabric = useMemo(() => getFabricColor(image), [image]);

  return (
    <group position={[0, GARMENT_TOP_Y, 0]}>
      <mesh geometry={body}>
        <meshStandardMaterial color={fabric} roughness={0.92} />
      </mesh>
      <mesh geometry={front}>
        <meshStandardMaterial map={texture} roughness={0.85} />
      </mesh>
    </group>
  );
}

function PlainPlaceholder({ shape }: { shape: PlaceholderShape }) {
  const body = useMemo(() => createGarmentBodyGeometry(shape), [shape]);
  return (
    <mesh geometry={body} position={[0, GARMENT_TOP_Y, 0]}>
      <meshStandardMaterial color={FALLBACK_FABRIC} roughness={0.92} />
    </mesh>
  );
}

/**
 * Samples the photo's average color for the garment's sides and back, so
 * the placeholder reads as one piece of fabric while it rotates. Falls back
 * to a neutral dark fabric if the image can't be read (e.g. a CDN response
 * without CORS headers taints the canvas).
 */
function getFabricColor(image: HTMLImageElement | undefined): string {
  if (!image) return FALLBACK_FABRIC;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) return FALLBACK_FABRIC;
    context.drawImage(image, 0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    // Slightly deepened so the photographed front stays the brightest face.
    return `#${new Color(`rgb(${r}, ${g}, ${b})`).multiplyScalar(0.75).getHexString()}`;
  } catch {
    return FALLBACK_FABRIC;
  }
}

const HOOK_POINTS = [
  new Vector3(0, -0.15, 0),
  new Vector3(0, -0.07, 0),
  new Vector3(-0.035, 0.0, 0),
  new Vector3(0, 0.055, 0),
  new Vector3(0.045, 0.015, 0),
  new Vector3(0.04, -0.015, 0),
];

function Hanger({ shape }: { shape: PlaceholderShape }) {
  const hook = useMemo(() => new TubeGeometry(new CatmullRomCurve3(HOOK_POINTS), 32, 0.009, 8), []);
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
    return new TubeGeometry(new CatmullRomCurve3(points), 32, 0.016, 8);
  }, [shape]);

  return (
    <group>
      <mesh geometry={hook}>
        <meshStandardMaterial color="#9a9a93" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh geometry={bar}>
        <meshStandardMaterial color="#3a3a36" roughness={0.6} />
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
