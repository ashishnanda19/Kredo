"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useSpring, useTransform, type MotionValue } from "framer-motion";
import { AppShot } from "./screens";

/** Geometry of the app's "Slide to pay" control in the 390x844 design box (see mobile/ Pay screen). */
const TRACK_W = 342;
const TRACK_H = 64;
const THUMB = 56;
const PAD = 4;
const TRAVEL = TRACK_W - THUMB - PAD * 2;
/** Where the track sits (the capture is stretched to the glass, so the vertical position is a share of the height). */
const TRACK_TOP = "85.55%";

/** Share of the pay stage's scroll the thumb travels over, and the point where it counts as paid. */
const SLIDE_FROM = 0.08;
const SLIDE_TO = 0.66;
const DONE_AT = 0.7;

/**
 * The "Confirm payment" screen with a live slider. `progress` (0 to 1) is how far through the pay stage the scroll is: the
 * thumb follows it, and when the thumb reaches the end the "Paid. Sorted." screen pops open from the thumb. Scrolling back
 * slides the thumb back and closes it again. The slider is drawn over the capture, which keeps the rest of the screen exact.
 */
export function ScrollPayScreen({ progress }: { progress: MotionValue<number> }) {
  const [done, setDone] = useState(() => progress.get() >= DONE_AT);
  // a light spring so the thumb glides between scroll ticks instead of stepping
  const p = useSpring(progress, { stiffness: 260, damping: 38, mass: 0.6 });
  const x = useTransform(p, [SLIDE_FROM, SLIDE_TO], [0, TRAVEL], { clamp: true });
  const fill = useTransform(x, (v) => v + THUMB + PAD * 2);
  const label = useTransform(p, [SLIDE_FROM, SLIDE_FROM + 0.22], [1, 0], { clamp: true });
  useMotionValueEvent(progress, "change", (v) => setDone((d) => (d ? v >= DONE_AT - 0.04 : v >= DONE_AT)));

  return (
    <div className="relative size-full overflow-hidden">
      <AppShot name="pay" />

      {/* covers the capture's own slider (flat sheet colour behind it), then draws a live one in the same place */}
      <div aria-hidden className="absolute bg-[#FAF9F6]" style={{ left: 14, width: 362, top: `calc(${TRACK_TOP} - 8px)`, height: TRACK_H + 16 }} />
      <div
        aria-hidden
        className="absolute overflow-hidden bg-[#0B0B0C]"
        style={{ left: 24, width: TRACK_W, top: TRACK_TOP, height: TRACK_H, borderRadius: TRACK_H / 2 }}
      >
        <motion.div className="absolute left-0 top-0 h-full bg-[#E3CB4A]" style={{ width: fill, borderRadius: TRACK_H / 2 }} />
        <motion.div
          className="absolute inset-0 flex items-center justify-center gap-2 pl-10 text-[16px] font-extrabold text-white"
          style={{ opacity: label }}
        >
          Slide to pay
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </motion.div>
        <motion.div className="absolute flex items-center justify-center" style={{ left: PAD, top: PAD, width: THUMB, height: THUMB, x }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B0B0C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </motion.div>
      </div>

      {/* the payment lands: the paid screen opens from the end of the slider with a small overshoot, and closes again on the way back */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={done ? { clipPath: "circle(150% at 88% 90%)", scale: 1 } : { clipPath: "circle(0% at 88% 90%)", scale: 1.1 }}
        transition={
          done
            ? { clipPath: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }, scale: { type: "spring", stiffness: 280, damping: 18 } }
            : { clipPath: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }, scale: { duration: 0.35 } }
        }
        style={{ willChange: "clip-path, transform" }}
      >
        <AppShot name="paid" />
      </motion.div>
    </div>
  );
}
