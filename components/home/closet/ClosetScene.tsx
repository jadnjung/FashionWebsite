'use client';

import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, PMREMGenerator, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ClosetGarment, getGarmentHeight } from '@/components/home/closet/ClosetGarment';
import type { ClosetGesture } from '@/components/home/closet/closet-gesture';
import { getPlaceholderShape } from '@/lib/home/closet-shape';
import { HANGER_SPACING, getHangerX, type ClosetState } from '@/lib/home/closet-state';
import type { ClosetProduct } from '@/lib/shopify/products';

// Below this canvas width the closet uses its narrow (mobile) layout: the
// rod is framed a few garments at a time for swiping, and the focused
// garment sits above the info panel instead of beside it. Matches
// Tailwind's `lg` breakpoint, where ClosetInfoPanel moves to the side.
const WIDE_LAYOUT_MIN_PX = 1024;

export const CAMERA_FOV = 35;
const HALF_FOV_TAN = Math.tan(MathUtils.degToRad(CAMERA_FOV / 2));
const CAMERA_Y = 0.2;
const MIN_CAMERA_Z = 4.5;
const MAX_CAMERA_Z = 9;
// Distance from the camera to a focused garment.
const FOCUS_DISTANCE = 4.2;
const RECEDED_Z = -1.4;
// On the rod, garments hang mostly side-on and closely spaced, as on a
// real clothes rail — pulling one out turns it to face the viewer. Hover
// grows it slightly and turns it partly toward the viewer, signalling it
// can be picked.
const ROD_YAW = -0.95;
const HOVER_YAW = -0.5;
const HOVER_SCALE = 1.06;
// Resting sway on the rail, and the livelier swing a hovered garment eases
// into — as if brushed by a hand. Amplitude in radians, speed in rad/s.
const SWAY_AMPLITUDE = 0.025;
const SWAY_SPEED = 0.8;
const HOVER_SWAY_AMPLITUDE = 0.09;
const HOVER_SWAY_SPEED = 1.7;
// How quickly sway strength changes between the two (lower = gentler).
const SWAY_EASE = 3;
const DRAG_THRESHOLD_PX = 6;
// Damping rate for every eased transition (higher = faster).
const EASE = 6;

interface ClosetSceneProps {
  products: ClosetProduct[];
  state: ClosetState;
  reducedMotion: boolean;
  gesture: ClosetGesture;
  onHover: (handle: string) => void;
  onUnhover: (handle: string) => void;
  onSelect: (handle: string) => void;
  onDismiss: () => void;
}

/** Frame-dependent placement shared by every part of the scene. */
interface ClosetLayout {
  wide: boolean;
  aspect: number;
  cameraZ: number;
  /** Visible width at the rod's depth, in scene units. */
  visibleWidth: number;
  rodY: number;
}

function getClosetLayout(width: number, height: number, count: number): ClosetLayout {
  const aspect = width / Math.max(1, height);
  const wide = width >= WIDE_LAYOUT_MIN_PX;
  // Wide: frame the whole rod. Narrow: frame about two and a half
  // garments and let the visitor swipe along the rest.
  const targetWidth = wide ? count * HANGER_SPACING + 1.4 : HANGER_SPACING * 2.6;
  const cameraZ = MathUtils.clamp(
    targetWidth / (2 * HALF_FOV_TAN * aspect),
    MIN_CAMERA_Z,
    MAX_CAMERA_Z,
  );
  const visibleHeight = 2 * cameraZ * HALF_FOV_TAN;
  // The rod sits near the top of the frame, leaving the hero's headline
  // and ENTER COLLECTION link clear in the lower-left.
  const rodY = CAMERA_Y + visibleHeight / 2 - visibleHeight * (wide ? 0.17 : 0.2);
  return { wide, aspect, cameraZ, visibleWidth: visibleHeight * aspect, rodY };
}

export function ClosetScene(props: ClosetSceneProps) {
  const { products, state, reducedMotion, gesture } = props;
  const size = useThree((s) => s.size);
  const layout = useMemo(
    () => getClosetLayout(size.width, size.height, products.length),
    [size.width, size.height, products.length],
  );
  const rodLength = products.length * HANGER_SPACING + 0.6;

  return (
    <>
      <StudioEnvironment />
      {/* Soft fill from above and below, so the side of each garment
          turned away from the key light still reads as cloth, not a void. */}
      <hemisphereLight args={['#f4f1ea', '#2a2723', 0.6]} />
      {/* Key light: soft shadows between neighbouring garments are what
          make the rail read as real cloth hanging in a space. */}
      <directionalLight
        position={[-2.5, 4, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.0008}
        shadow-normalBias={0.04}
        // Partial shadows: neighbours and hangers shade a garment rather
        // than blacking it out.
        shadow-intensity={0.6}
      />
      <directionalLight position={[4, 1.5, -3]} intensity={0.7} />

      <CameraRig gesture={gesture} reducedMotion={reducedMotion} cameraZ={layout.cameraZ} />
      <Scrim active={state.selected !== null} reducedMotion={reducedMotion} />
      <ClosetControls {...props} layout={layout} />

      <group position={[0, layout.rodY, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.028, 0.028, rodLength, 16]} />
          <meshStandardMaterial color="#b9b9b1" metalness={0.8} roughness={0.3} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[(side * rodLength) / 2, 2, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 4, 8]} />
            <meshStandardMaterial color="#9a9a93" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {products.map((product, index) => (
        <ClosetItem
          key={product.handle}
          product={product}
          index={index}
          rodX={getHangerX(index, products.length)}
          layout={layout}
          state={state}
          reducedMotion={reducedMotion}
          gesture={gesture}
          onHover={props.onHover}
          onUnhover={props.onUnhover}
          onSelect={props.onSelect}
          onDismiss={props.onDismiss}
        />
      ))}
    </>
  );
}

interface ClosetItemProps extends Omit<ClosetSceneProps, 'products'> {
  product: ClosetProduct;
  index: number;
  rodX: number;
  layout: ClosetLayout;
}

function ClosetItem({
  product,
  index,
  rodX,
  layout,
  state,
  reducedMotion,
  gesture,
  onHover,
  onUnhover,
  onSelect,
  onDismiss,
}: ClosetItemProps) {
  const group = useRef<Group>(null);
  // Accumulated sway phase and current strength, eased between the resting
  // and hovered values so the swing never jumps when the cursor arrives or
  // leaves (recomputing from the clock at a new speed would).
  const sway = useRef({ phase: index * 1.7, amplitude: SWAY_AMPLITUDE, speed: SWAY_SPEED });
  const shape = useMemo(() => getPlaceholderShape(product.productType), [product.productType]);
  const garmentHeight = getGarmentHeight(product, shape);
  const { wide, aspect, rodY } = layout;

  const isSelected = state.selected === product.handle;
  const anySelected = state.selected !== null;
  const isHovered = state.hovered === product.handle && !anySelected;

  useFrame(({ camera }, delta) => {
    const node = group.current;
    if (!node) return;
    const damp = (from: number, to: number) =>
      reducedMotion ? to : MathUtils.damp(from, to, EASE, delta);

    let targetX = rodX;
    let targetY = rodY;
    let targetZ = anySelected ? RECEDED_Z : 0;
    let targetScale = isHovered ? HOVER_SCALE : 1;

    if (isSelected) {
      // Front-and-center, in front of the receded rod. Sized and placed
      // from the visible frame at the focus depth so it fits every screen:
      // left of center beside the panel on wide screens, above the panel on
      // narrow ones.
      const frameHeight = 2 * FOCUS_DISTANCE * HALF_FOV_TAN;
      const frameWidth = frameHeight * aspect;
      const availableHeight = frameHeight * (wide ? 0.78 : 0.4);
      targetScale = Math.min(
        1.8,
        availableHeight / (garmentHeight + 0.3),
        (frameWidth * 0.8) / 1.2,
      );
      const centerY = wide ? CAMERA_Y : CAMERA_Y + frameHeight * 0.2;
      targetX = camera.position.x + (wide ? -frameWidth * 0.16 : 0);
      targetY = centerY + (0.15 + garmentHeight / 2) * targetScale;
      targetZ = camera.position.z - FOCUS_DISTANCE;
    }

    node.position.set(
      damp(node.position.x, targetX),
      damp(node.position.y, targetY),
      damp(node.position.z, targetZ),
    );
    node.scale.setScalar(damp(node.scale.x, targetScale));

    if (isSelected) {
      if (!reducedMotion) gesture.tickAutoRotate(delta);
      node.rotation.y = gesture.yaw;
      node.rotation.z = damp(node.rotation.z, 0);
    } else {
      // Unwind to the nearest whole turn of the resting angle, so a
      // returning garment never spins back through several revolutions.
      const baseYaw = isHovered ? HOVER_YAW : ROD_YAW;
      const turns = Math.round((node.rotation.y - baseYaw) / (Math.PI * 2));
      node.rotation.y = damp(node.rotation.y, baseYaw + turns * Math.PI * 2);
      const swing = sway.current;
      swing.amplitude = MathUtils.damp(
        swing.amplitude,
        isHovered ? HOVER_SWAY_AMPLITUDE : SWAY_AMPLITUDE,
        SWAY_EASE,
        delta,
      );
      swing.speed = MathUtils.damp(
        swing.speed,
        isHovered ? HOVER_SWAY_SPEED : SWAY_SPEED,
        SWAY_EASE,
        delta,
      );
      swing.phase += swing.speed * delta;
      const tilt = reducedMotion ? 0 : Math.sin(swing.phase) * swing.amplitude;
      node.rotation.z = damp(node.rotation.z, tilt);
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (gesture.dragged) return;
    // While a garment is out, the receded rod counts as "outside" — clicking
    // it returns the focused piece rather than swapping it.
    if (anySelected && !isSelected) {
      onDismiss();
      return;
    }
    if (!isSelected) onSelect(product.handle);
  };

  return (
    <group
      ref={group}
      position={[rodX, rodY, 0]}
      rotation={[0, ROD_YAW, 0]}
      onClick={handleClick}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(product.handle);
      }}
      onPointerOut={() => onUnhover(product.handle)}
    >
      <ClosetGarment product={product} shape={shape} />
    </group>
  );
}

/**
 * Soft, image-based studio lighting (three's built-in RoomEnvironment,
 * prefiltered once) — gives fabric and metal the gentle, all-round
 * reflections a plain set of point lights can't.
 */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const environment = useMemo(() => {
    const generator = new PMREMGenerator(gl);
    const texture = generator.fromScene(new RoomEnvironment(), 0.04).texture;
    generator.dispose();
    return texture;
  }, [gl]);
  useEffect(() => () => environment.dispose(), [environment]);
  return <primitive object={environment} attach="environment" />;
}

/**
 * Darkens the receded rod while a garment is out, so the focused piece and
 * its info panel read clearly. Follows the camera, just behind the focus
 * depth. Ignored by raycasting, so a click on the dimmed rod still reaches
 * those garments (which treat it as "outside").
 */
function Scrim({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshBasicMaterial>(null);
  useFrame(({ camera }, delta) => {
    if (!mesh.current || !material.current) return;
    mesh.current.position.set(camera.position.x, CAMERA_Y, camera.position.z - FOCUS_DISTANCE - 1);
    const target = active ? 0.72 : 0;
    material.current.opacity = reducedMotion
      ? target
      : MathUtils.damp(material.current.opacity, target, EASE, delta);
    mesh.current.visible = material.current.opacity > 0.01;
  });
  return (
    <mesh ref={mesh} raycast={() => null} renderOrder={1} visible={false}>
      <planeGeometry args={[40, 20]} />
      <meshBasicMaterial
        ref={material}
        color="#050505"
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}

interface CameraRigProps {
  gesture: ClosetGesture;
  reducedMotion: boolean;
  cameraZ: number;
}

function CameraRig({ gesture, reducedMotion, cameraZ }: CameraRigProps) {
  useFrame(({ camera }, delta) => {
    const ease = (from: number, to: number) =>
      reducedMotion ? to : MathUtils.damp(from, to, EASE, delta);
    camera.position.x = ease(camera.position.x, gesture.pan);
    camera.position.z = ease(camera.position.z, cameraZ);
  });
  return null;
}

/**
 * Pointer gestures on the canvas: a horizontal drag pans along the rod
 * (mobile swipe) when nothing is selected, and rotates the focused garment
 * when one is. `touch-action: pan-y` on the canvas leaves vertical page
 * scrolling to the browser. (Clicking empty space is the Canvas's own
 * onPointerMissed, in ClosetExperience.)
 */
function ClosetControls({
  products,
  state,
  gesture,
  layout,
}: ClosetSceneProps & { layout: ClosetLayout }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const selectedRef = useRef(state.selected);
  const { visibleWidth } = layout;

  // Re-clamp the pan when the layout changes (resize, rotation).
  useEffect(() => {
    gesture.clampPan(products.length, visibleWidth);
  }, [gesture, products.length, visibleWidth]);

  // Each newly focused garment starts facing front.
  useEffect(() => {
    selectedRef.current = state.selected;
    if (state.selected) gesture.resetFocus();
  }, [gesture, state.selected]);

  useEffect(() => {
    const element = gl.domElement;
    const unitsPerPx = visibleWidth / size.width;
    let pointerId: number | null = null;
    let startX = 0;
    let lastX = 0;

    const onDown = (event: PointerEvent) => {
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      gesture.beginPointer();
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      if (!gesture.dragged && Math.abs(event.clientX - startX) < DRAG_THRESHOLD_PX) return;
      gesture.markDragged();
      if (selectedRef.current) gesture.rotateByPixels(dx);
      else gesture.panBy(-dx * unitsPerPx, products.length, visibleWidth);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      // Settle any distance not yet seen as a move (coalesced or dropped
      // pointermove events), so a real drag is never mistaken for a click.
      onMove(event);
      pointerId = null;
    };

    element.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      element.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [gl, gesture, products.length, visibleWidth, size.width]);

  return null;
}
