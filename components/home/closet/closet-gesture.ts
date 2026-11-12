import { clampRodPan } from '@/lib/home/closet-state';

const AUTO_ROTATE_SPEED = 0.45; // radians per second
const AUTO_ROTATE_RESUME_MS = 2000;
const DRAG_RADIANS_PER_PX = 0.012;

/**
 * Per-frame gesture state for the Collection Closet (DECISIONS.md D-089):
 * written by pointer handlers, read inside useFrame. Deliberately outside
 * React state — these values change every pointer move and every frame,
 * and routing them through renders would re-render the whole scene at
 * 60fps. Mutated only through these methods, so components can share one
 * instance without writing to a prop.
 */
export class ClosetGesture {
  /** Camera's target x along the rod (swipe pan). */
  pan = 0;
  /** Focused garment's yaw, in radians. */
  yaw = 0;
  /** True once the active pointer gesture crossed the drag threshold, so its click is ignored. */
  dragged = false;
  private lastDragAt = 0;

  beginPointer() {
    this.dragged = false;
  }

  markDragged() {
    this.dragged = true;
  }

  panBy(delta: number, count: number, visibleWidth: number) {
    this.pan = clampRodPan(this.pan + delta, count, visibleWidth);
  }

  clampPan(count: number, visibleWidth: number) {
    this.pan = clampRodPan(this.pan, count, visibleWidth);
  }

  rotateByPixels(dx: number) {
    this.yaw += dx * DRAG_RADIANS_PER_PX;
    this.lastDragAt = performance.now();
  }

  /** A newly focused garment starts facing front, auto-rotating. */
  resetFocus() {
    this.yaw = 0;
    this.lastDragAt = 0;
  }

  /** Advances the slow auto-rotation, paused for a moment after a manual drag. */
  tickAutoRotate(delta: number) {
    if (performance.now() - this.lastDragAt > AUTO_ROTATE_RESUME_MS) {
      this.yaw += AUTO_ROTATE_SPEED * delta;
    }
  }
}
