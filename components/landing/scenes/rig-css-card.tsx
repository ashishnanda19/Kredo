"use client";

import { useEffect, useRef } from "react";
import { BadgeCheck } from "lucide-react";
import { CardFaces } from "@/components/three/card-faces";
import { student } from "@/lib/mock-data";
import { gsap } from "@/lib/scroll";
import { cardRig, rigReady } from "./card-rig";

/**
 * Fixed, scroll-choreographed card rendered with CSS 3D. Used on low-power devices (and as the
 * renderer until the WebGL card is ready). Reads the same pose object as the WebGL card.
 */
export function RigCssCard() {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const badge = useRef<HTMLSpanElement>(null);
  const ripple = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const body = inner.current;
    if (!el || !body) return;
    let tiltX = 0;
    let tiltY = 0;
    let first = true;

    const update = () => {
      const { pose: p, pointer, drag } = cardRig;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = p.w * vw;
      const h = w / 1.586;
      tiltX += (-pointer.y * 0.16 - tiltX) * 0.1;
      tiltY += (pointer.x * 0.26 + drag.y - tiltY) * 0.1;

      el.style.width = `${w}px`;
      el.style.opacity = String(p.opacity);
      el.style.transform = `translate3d(${(p.x * 0.5 + 0.5) * vw - w / 2}px, ${(0.5 - p.y * 0.5) * vh - h / 2}px, 0) rotateZ(${-p.rotZ}rad)`;
      body.style.transform = `rotateX(${-(p.rotX + tiltX)}rad) rotateY(${p.rotY + tiltY}rad)`;
      if (badge.current) {
        badge.current.style.opacity = String(p.badge);
        badge.current.style.transform = `scale(${0.6 + p.badge * 0.5})`;
      }
      if (ripple.current) {
        ripple.current.style.opacity = String(p.pulse > 0 && p.pulse < 1 ? 1 - p.pulse : 0);
        ripple.current.style.transform = `scale(${1 + p.pulse * 0.6})`;
      }
      if (first) {
        first = false;
        rigReady.set(true);
      }
    };

    gsap.ticker.add(update);
    update();
    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[20] aspect-[1.586/1] will-change-transform [perspective:1200px]"
      style={{ width: 0, opacity: 0 }}
    >
      <span
        ref={ripple}
        className="absolute inset-0 rounded-[7%/11%] border-2 border-neon-magenta opacity-0 shadow-[0_0_30px_6px_var(--glow-magenta)]"
      />
      <div ref={inner} className="absolute inset-0 [transform-style:preserve-3d]">
        <CardFaces
          name={student.name}
          number="•••• •••• •••• 0042"
          frontExtra={
            <span
              ref={badge}
              className="absolute right-[6%] top-[34%] grid size-[17%] place-items-center rounded-full bg-success text-[#052e16] opacity-0 shadow-[0_0_28px_6px_rgba(74,222,128,0.55)]"
            >
              <BadgeCheck className="size-3/4" />
            </span>
          }
        />
      </div>
    </div>
  );
}
