'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ShopTheLookPanel } from '@/components/looks/ShopTheLookPanel';
import { trackEvent } from '@/lib/analytics/gtag';
import {
  closeness,
  frontIndex,
  lookScale,
  relativeAngle,
  rotationForIndex,
  stepDegrees,
} from '@/lib/looks/ring';
import type { Look } from '@/lib/shopify/looks';

// Below this many looks a ring reads as broken rather than intriguing, so
// the section shows the grid only.
const MIN_RING_LOOKS = 4;
// The ring is seen from slightly above, so the circle reads as a circle,
// rather than edge-on or from a bird's-eye view.
const TILT_DEGREES = -20;
// One look every ~6 seconds.
const SECONDS_PER_LOOK = 6;
// Auto-rotation waits this long after the visitor's last interaction.
const RESUME_AFTER_MS = 2500;
const DRAG_THRESHOLD_PX = 6;
const DRAG_DEGREES_PER_PX = 0.3;
const EASE = 6;
// How much a look directly behind is darkened.
const MAX_DIM = 0.6;
// CSS perspective distance of the ring's stage, in px.
const PERSPECTIVE_PX = 1600;
// Ring cards narrower than this drop the piece count so the label fits.
const COMPACT_CARD_PX = 160;

type View = 'ring' | 'grid';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

export function lookLabel(look: Look, index: number): string {
  return (look.title ?? `Look ${String(index + 1).padStart(2, '0')}`).toUpperCase();
}

function piecesLabel(look: Look): string {
  return `${look.products.length} ${look.products.length === 1 ? 'PIECE' : 'PIECES'}`;
}

interface LooksExperienceProps {
  looks: Look[];
}

/**
 * The homepage "Shop the Look" section (DECISIONS.md D-091): the curated
 * looks slowly circling on a tilted 3D ring (CSS 3D — the looks are flat
 * photographs, so no WebGL is needed), the nearest look largest; or, at
 * the visitor's choice, all looks at once in a grid. Choosing a look opens
 * its Shop the Look panel.
 */
export function LooksExperience({ looks }: LooksExperienceProps) {
  const count = looks.length;
  const ringAvailable = count >= MIN_RING_LOOKS;
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
  // The visitor's explicit choice; until they make one, reduced motion
  // starts on the still grid and everyone else on the ring.
  const [chosenView, setChosenView] = useState<View | null>(null);
  const view: View = !ringAvailable ? 'grid' : (chosenView ?? (reducedMotion ? 'grid' : 'ring'));
  const [playing, setPlaying] = useState(true);
  const [front, setFront] = useState(0);
  const [panel, setPanel] = useState<{ index: number; open: boolean } | null>(null);

  const openLook = useCallback(
    (index: number) => {
      const look = looks[index];
      if (!look) return;
      trackEvent('look_select', { look_handle: look.handle });
      trackEvent('shop_the_look_open', {});
      setPanel({ index, open: true });
    },
    [looks],
  );

  const panelLook = panel ? looks[panel.index] : undefined;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 md:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
            {String(count).padStart(2, '0')} LOOKS
          </p>
          <h2
            id="shop-the-look-heading"
            className="font-display text-heading-2 uppercase tracking-display text-esque-text"
          >
            Shop the Look
          </h2>
        </div>
        {ringAvailable && (
          <button
            type="button"
            onClick={() => setChosenView(view === 'ring' ? 'grid' : 'ring')}
            className="py-2 text-utility uppercase tracking-nav text-esque-text underline-offset-4 transition-colors duration-200 ease-esque hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          >
            {view === 'ring' ? 'VIEW ALL LOOKS' : 'VIEW ROTATION'}
          </button>
        )}
      </div>

      {view === 'ring' ? (
        <LookRing
          looks={looks}
          reducedMotion={reducedMotion}
          playing={playing && !reducedMotion}
          onTogglePlaying={() => setPlaying((value) => !value)}
          front={front}
          onFrontChange={setFront}
          onSelect={openLook}
        />
      ) : (
        <ul
          className="esque-looks-fade grid grid-cols-2 gap-x-4 gap-y-8 px-4 md:grid-cols-3 md:px-8"
          aria-label="All looks"
        >
          {looks.map((look, index) => (
            <li key={look.handle}>
              <LookCard
                look={look}
                index={index}
                sizes="(min-width: 768px) 33vw, 50vw"
                onSelect={() => openLook(index)}
              />
            </li>
          ))}
        </ul>
      )}

      {panel && panelLook && (
        <ShopTheLookPanel
          key={panelLook.handle}
          products={panelLook.products}
          lookLabel={lookLabel(panelLook, panel.index)}
          open={panel.open}
          // Closing keeps the panel mounted (just closed), so the native
          // <dialog> returns focus to the look that opened it.
          onClose={() => setPanel({ index: panel.index, open: false })}
        />
      )}
    </div>
  );
}

interface LookCardProps {
  look: Look;
  index: number;
  sizes: string;
  /** Hide the piece count (narrow ring cards); it stays in the accessible name. */
  compact?: boolean;
  onSelect: () => void;
  onFocus?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}

function LookCard({ look, index, sizes, compact = false, onSelect, onFocus, ref }: LookCardProps) {
  const label = lookLabel(look, index);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      onFocus={onFocus}
      aria-label={`${label}, ${look.products.length} ${look.products.length === 1 ? 'piece' : 'pieces'}`}
      data-cursor="VIEW"
      className="group flex w-full flex-col gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-esque-text"
    >
      <span className="relative block aspect-[4/5] w-full overflow-hidden bg-esque-elevated">
        {look.image && (
          <Image
            src={look.image.url}
            alt=""
            fill
            sizes={sizes}
            draggable={false}
            className="object-cover transition-transform duration-500 ease-esque group-hover:scale-[1.02]"
          />
        )}
      </span>
      <span className="flex items-baseline justify-between gap-2 whitespace-nowrap">
        <span className="text-utility uppercase tracking-nav text-esque-text">{label}</span>
        {!compact && (
          <span className="text-utility uppercase tracking-metadata text-esque-text-secondary">
            {piecesLabel(look)}
          </span>
        )}
      </span>
    </button>
  );
}

interface LookRingProps {
  looks: Look[];
  reducedMotion: boolean;
  playing: boolean;
  onTogglePlaying: () => void;
  front: number;
  onFrontChange: (index: number) => void;
  onSelect: (index: number) => void;
}

function LookRing({
  looks,
  reducedMotion,
  playing,
  onTogglePlaying,
  front,
  onFrontChange,
  onSelect,
}: LookRingProps) {
  const count = looks.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dimRefs = useRef<Array<HTMLSpanElement | null>>([]);
  // Animation state lives in a ref: it changes every frame, and React only
  // needs to know when the front look changes.
  const motion = useRef({
    rotation: 0,
    target: null as number | null,
    lastInteraction: 0,
    hovering: false,
    dragging: false,
    dragged: false,
    front: 0,
  });
  const [cardWidth, setCardWidth] = useState(220);
  const [announce, setAnnounce] = useState('');

  // Card size follows the section width; the ring radius follows the card.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      setCardWidth(Math.round(Math.min(210, Math.max(110, width * 0.15))));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const radius = cardWidth * 2.1;

  const interact = useCallback(() => {
    motion.current.lastInteraction = performance.now();
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const state = motion.current;
      state.target = rotationForIndex(
        ((index % count) + count) % count,
        count,
        state.target ?? state.rotation,
      );
      interact();
    },
    [count, interact],
  );

  // The render loop: positions every card on the ring each frame.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let visible = true;
    const step = stepDegrees(count);
    const degreesPerSecond = step / SECONDS_PER_LOOK;

    const draw = () => {
      const { rotation } = motion.current;
      for (let i = 0; i < count; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;
        const angle = relativeAngle(i, count, rotation);
        // Placed on the ring, then turned back to face the viewer (and
        // un-tilted), so every look stays readable as it circles.
        card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px) rotateY(${-angle}deg) rotateX(${-TILT_DEGREES}deg) scale(${lookScale(i, count, rotation)})`;
        const dim = dimRefs.current[i];
        if (dim) dim.style.opacity = String((1 - closeness(i, count, rotation)) * MAX_DIM);
      }
      const nextFront = frontIndex(count, rotation);
      if (nextFront !== motion.current.front) {
        motion.current.front = nextFront;
        onFrontChange(nextFront);
      }
    };

    const tick = (now: number) => {
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      const state = motion.current;
      if (!state.dragging) {
        if (state.target !== null) {
          const next = reducedMotion
            ? state.target
            : state.rotation + (state.target - state.rotation) * (1 - Math.exp(-EASE * delta));
          state.rotation = next;
          if (Math.abs(state.target - next) < 0.05) {
            state.rotation = state.target;
            state.target = null;
          }
        } else if (playing && !state.hovering && now - state.lastInteraction > RESUME_AFTER_MS) {
          state.rotation -= degreesPerSecond * delta;
        }
      }
      draw();
      if (visible) frame = requestAnimationFrame(tick);
    };

    draw();
    frame = requestAnimationFrame(tick);

    // Stop the loop entirely while the section is off-screen.
    const stage = stageRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      const nowVisible = entry?.isIntersecting ?? true;
      if (nowVisible && !visible) {
        visible = true;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      } else if (!nowVisible) {
        visible = false;
        cancelAnimationFrame(frame);
      }
    });
    if (stage) observer.observe(stage);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [count, radius, playing, reducedMotion, onFrontChange]);

  // Drag / swipe to spin; releasing settles on the nearest look.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let pointerId: number | null = null;
    let startX = 0;
    let lastX = 0;

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      motion.current.dragged = false;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const state = motion.current;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      if (!state.dragging && Math.abs(event.clientX - startX) < DRAG_THRESHOLD_PX) return;
      state.dragging = true;
      state.dragged = true;
      state.target = null;
      state.rotation += dx * DRAG_DEGREES_PER_PX;
      interact();
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      const state = motion.current;
      if (state.dragging) {
        state.dragging = false;
        state.target = rotationForIndex(frontIndex(count, state.rotation), count, state.rotation);
        interact();
      }
    };

    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      stage.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [count, interact]);

  const step = stepDegrees(count);
  const cardHeight = cardWidth * 1.25 + 28;
  // Fit the stage to what perspective actually draws: the front card is
  // magnified (it's `radius` nearer the viewer) and dropped by the tilt;
  // the back card is shrunk and lifted. Anchoring the ring's center from
  // those extents keeps the front card's label inside the stage and leaves
  // no dead band above the back of the ring.
  const tiltSin = Math.sin((Math.abs(TILT_DEGREES) * Math.PI) / 180);
  const tiltCos = Math.cos((Math.abs(TILT_DEGREES) * Math.PI) / 180);
  const frontMag = PERSPECTIVE_PX / (PERSPECTIVE_PX - radius * tiltCos);
  const backMag = PERSPECTIVE_PX / (PERSPECTIVE_PX + radius * tiltCos);
  const frontBottom = (radius * tiltSin + cardHeight / 2) * frontMag;
  const backTop = (radius * tiltSin + (cardHeight * 0.62) / 2) * backMag;
  const padding = 16;
  const stageHeight = Math.round(frontBottom + backTop + padding * 2);
  const centerY = Math.round(backTop + padding);

  const announceFront = (index: number) => {
    const look = looks[((index % count) + count) % count];
    if (look) setAnnounce(`${lookLabel(look, ((index % count) + count) % count)} in front.`);
  };

  return (
    <div className="esque-looks-fade flex flex-col gap-6">
      <div
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Looks"
        onPointerEnter={() => {
          motion.current.hovering = true;
        }}
        onPointerLeave={() => {
          motion.current.hovering = false;
          interact();
        }}
        onFocusCapture={interact}
        className="relative w-full overflow-hidden [touch-action:pan-y]"
        style={{
          height: stageHeight,
          perspective: PERSPECTIVE_PX,
          perspectiveOrigin: `50% ${centerY}px`,
        }}
      >
        <div
          className="absolute left-1/2 h-0 w-0 [transform-style:preserve-3d]"
          style={{ top: centerY, transform: `rotateX(${TILT_DEGREES}deg)` }}
        >
          {looks.map((look, index) => (
            <div
              key={look.handle}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className="absolute"
              style={{
                width: cardWidth,
                left: -cardWidth / 2,
                top: -cardHeight / 2,
                // First paint, before the loop runs: the same placement the
                // loop computes at rotation 0.
                transform: `rotateY(${index * step}deg) translateZ(${radius}px) rotateY(${-index * step}deg) rotateX(${-TILT_DEGREES}deg)`,
              }}
            >
              <LookCard
                look={look}
                index={index}
                sizes={`${cardWidth}px`}
                compact={cardWidth < COMPACT_CARD_PX}
                onFocus={() => goTo(index)}
                onSelect={() => {
                  if (motion.current.dragged) return;
                  goTo(index);
                  onSelect(index);
                }}
              />
              <span
                ref={(node) => {
                  dimRefs.current[index] = node;
                }}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-esque-black opacity-0"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 px-4">
        <button
          type="button"
          onClick={() => {
            goTo(front - 1);
            announceFront(front - 1);
          }}
          className="min-h-6 py-2 text-utility uppercase tracking-nav text-esque-text transition-colors duration-200 ease-esque hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          ← PREV
        </button>
        {!reducedMotion && (
          <button
            type="button"
            onClick={onTogglePlaying}
            aria-pressed={!playing}
            className="min-h-6 py-2 text-utility uppercase tracking-nav text-esque-text-secondary transition-colors duration-200 ease-esque hover:text-esque-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          >
            {playing ? 'PAUSE' : 'PLAY'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            goTo(front + 1);
            announceFront(front + 1);
          }}
          className="min-h-6 py-2 text-utility uppercase tracking-nav text-esque-text transition-colors duration-200 ease-esque hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          NEXT →
        </button>
      </div>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
