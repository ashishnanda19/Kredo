/**
 * The "card rig": ONE mutable pose object that GSAP ScrollTrigger tweens as the user scrolls the
 * landing page. Renderers (WebGL card, or the CSS fallback) read it every frame. Because GSAP only
 * writes this plain object (never a DOM node that Framer Motion owns), the two libraries never fight.
 *
 * Coordinates are viewport-normalised: x,y in [-1, 1] (0,0 = centre, +y up); w = card width as a
 * fraction of viewport width; rotations in radians (+rotY turns the right edge away from the viewer).
 */

export interface CardPose {
  x: number;
  y: number;
  w: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  /** 0 to 1: "tap" ripple */
  pulse: number;
  /** 0 to 1: verified-badge glow */
  badge: number;
  opacity: number;
}

export interface CardRig {
  pose: CardPose;
  /** pointer position, -1..1 (desktop) */
  pointer: { x: number; y: number };
  /** touch-drag rotation in radians (adds to pose) */
  drag: { x: number; y: number };
  /** gauge anchor: DOM element the 3D score gauge should sit over, and whether it is on screen */
  gauge: { anchor: HTMLElement | null; visible: boolean; value: number; pulse: number };
}

export const heroPoseDefault: CardPose = {
  x: 0.36,
  y: 0,
  w: 0.3,
  rotX: 0.1,
  rotY: -0.35,
  rotZ: 0.1,
  pulse: 0,
  badge: 0,
  opacity: 1,
};

export const cardRig: CardRig = {
  pose: { ...heroPoseDefault },
  pointer: { x: 0, y: 0 },
  drag: { x: 0, y: 0 },
  gauge: { anchor: null, visible: false, value: 62, pulse: 0 },
};

const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

/** Where the card sits in the hero: measured from the hero's placeholder slot (responsive for free). */
export function measureHeroPose(): Partial<CardPose> {
  const slot = document.querySelector<HTMLElement>("[data-hero-card-slot]");
  if (!slot) return heroPoseDefault;
  const r = slot.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = r.left + r.width / 2;
  const cy = r.top + window.scrollY + r.height / 2; // document position == viewport position at scrollY 0
  return {
    x: (cx / vw) * 2 - 1,
    y: 1 - (cy / vh) * 2,
    w: (r.width * 0.96) / vw,
    rotX: 0.1,
    rotY: -0.35,
    rotZ: 0.1,
    pulse: 0,
    badge: 0,
    opacity: 1,
  };
}

/** Poses for each scroll stop. Desktop shifts the card left/right of the step text; mobile stacks it above. */
export const poses = {
  step1: (): Partial<CardPose> =>
    isDesktop()
      ? { x: -0.4, y: 0.02, w: 0.3, rotX: 0.08, rotY: 0.5, rotZ: -0.05, badge: 1, pulse: 0, opacity: 1 }
      : { x: 0, y: 0.22, w: 0.58, rotX: 0.08, rotY: 0.45, rotZ: -0.04, badge: 1, pulse: 0, opacity: 1 },
  step2: (): Partial<CardPose> =>
    isDesktop()
      ? { x: 0.4, y: 0.02, w: 0.3, rotX: 0.06, rotY: Math.PI + 0.4, rotZ: 0.05, badge: 0, pulse: 0, opacity: 1 }
      : { x: 0, y: 0.22, w: 0.58, rotX: 0.06, rotY: Math.PI + 0.35, rotZ: 0.04, badge: 0, pulse: 0, opacity: 1 },
  step3: (): Partial<CardPose> =>
    isDesktop()
      ? { x: 0, y: 0.36, w: 0.28, rotX: 0.1, rotY: Math.PI * 2, rotZ: 0, badge: 0, opacity: 1 }
      : { x: 0, y: 0.22, w: 0.6, rotX: 0.1, rotY: Math.PI * 2, rotZ: 0, badge: 0, opacity: 1 },
  /** tucked into the bottom-left corner while the score gauge takes focus */
  corner: (): Partial<CardPose> =>
    isDesktop()
      ? { x: -0.84, y: -0.72, w: 0.12, rotX: 0.1, rotY: Math.PI * 2 - 0.45, rotZ: 0.08, pulse: 0, badge: 0, opacity: 1 }
      : { x: -0.74, y: -0.8, w: 0.26, rotX: 0.1, rotY: Math.PI * 2 - 0.45, rotZ: 0.08, pulse: 0, badge: 0, opacity: 0.9 },
};

export function resetRig() {
  Object.assign(cardRig.pose, heroPoseDefault);
  cardRig.drag.x = 0;
  cardRig.drag.y = 0;
  cardRig.gauge.visible = false;
  cardRig.gauge.anchor = null;
}

/* ---- tiny external store: has a renderer drawn its first frame? (hides the inline poster) ---- */
let ready = false;
const subs = new Set<() => void>();
export const rigReady = {
  get: () => ready,
  set(v: boolean) {
    if (ready === v) return;
    ready = v;
    subs.forEach((s) => s());
  },
  subscribe(cb: () => void) {
    subs.add(cb);
    return () => {
      subs.delete(cb);
    };
  },
};

/* ---- is the WebGL renderer (card + gauge) live? The score section swaps its SVG gauge for the 3D one. ---- */
function makeStore<T>(initial: T) {
  let value = initial;
  const subs = new Set<() => void>();
  return {
    get: () => value,
    set(v: T) {
      if (Object.is(v, value)) return;
      value = v;
      subs.forEach((s) => s());
    },
    subscribe(cb: () => void) {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
  };
}

export const gaugeGl = makeStore(false);
/** current score shown by the landing 3D gauge (set by the score explainer slider) */
export const gaugeValue = makeStore(62);
