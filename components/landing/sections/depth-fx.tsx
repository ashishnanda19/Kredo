"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap, registerGsap } from "@/lib/scroll";

type Lean = { x: number; y: number; tx: number; ty: number };

/**
 * Depth for the landing page, from three small behaviours that share one pointer listener and the one GSAP ticker.
 * None of them re-render React; they only write CSS variables or one transform on the elements involved.
 *
 * - `[data-tilt]`: a card leans towards the pointer in 3D (--tx and --ty, each -1 to 1, eased every frame). Anything
 *   inside marked `[data-lift]` slides a few pixels the same way, which reads as a layer floating above the card.
 *   The styles are in globals.css and only apply while the card is `[data-live]`, so resting cards cost nothing.
 * - `[data-magnetic]`: a wrapper round a button that drifts a little towards the pointer (--gx and --gy, in px).
 * - `[data-skew]`: a ticker that shears with the scroll speed and settles when the page rests.
 *
 * Tilt and magnets are for fine pointers only. Everything is off under reduced motion.
 */
export function DepthFx() {
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (reduce) return;
    registerGsap();
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const leans = new Map<HTMLElement, Lean>();
    let card: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;

    const aim = (el: HTMLElement, tx: number, ty: number) => {
      const l = leans.get(el);
      if (l) {
        l.tx = tx;
        l.ty = ty;
      } else {
        leans.set(el, { x: 0, y: 0, tx, ty });
        el.setAttribute("data-live", "");
      }
    };
    const release = (el: HTMLElement) => {
      el.style.setProperty("--gx", "0px");
      el.style.setProperty("--gy", "0px");
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const t = e.target as HTMLElement | null;
      const c = t?.closest?.<HTMLElement>("[data-tilt]") ?? null;
      if (c !== card) {
        if (card) aim(card, 0, 0);
        card = c;
      }
      if (c) {
        const r = c.getBoundingClientRect();
        aim(c, ((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
      }
      const m = t?.closest?.<HTMLElement>("[data-magnetic]") ?? null;
      if (m !== magnet) {
        if (magnet) release(magnet);
        magnet = m;
      }
      if (m) {
        const r = m.getBoundingClientRect();
        m.style.setProperty("--gx", `${((e.clientX - (r.left + r.width / 2)) * 0.28).toFixed(1)}px`);
        m.style.setProperty("--gy", `${((e.clientY - (r.top + r.height / 2)) * 0.36).toFixed(1)}px`);
      }
    };
    const onLeave = () => {
      if (card) aim(card, 0, 0);
      if (magnet) release(magnet);
      card = magnet = null;
    };

    // tickers that shear with the scroll: only the ones on screen are touched
    const skews = new Set<HTMLElement>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) skews.add(el);
        else {
          skews.delete(el);
          el.style.transform = "";
        }
      }
    });
    document.querySelectorAll<HTMLElement>("[data-skew]").forEach((el) => io.observe(el));
    let lastY = window.scrollY;
    let sv = 0;
    let sheared = false;

    const tick = (_: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 50) / 1000 || 0.016;
      const k = 1 - Math.exp(-dt * 9);
      for (const [el, l] of leans) {
        l.x += (l.tx - l.x) * k;
        l.y += (l.ty - l.y) * k;
        if (l.tx === 0 && l.ty === 0 && Math.abs(l.x) < 0.004 && Math.abs(l.y) < 0.004) {
          leans.delete(el);
          el.removeAttribute("data-live");
          el.style.removeProperty("--tx");
          el.style.removeProperty("--ty");
        } else {
          el.style.setProperty("--tx", l.x.toFixed(4));
          el.style.setProperty("--ty", l.y.toFixed(4));
        }
      }

      const y = window.scrollY;
      const speed = (y - lastY) / dt; // px per second
      lastY = y;
      sv += (Math.max(-1, Math.min(1, speed / 2600)) - sv) * (1 - Math.exp(-dt * 7));
      if (Math.abs(sv) > 0.004) {
        sheared = true;
        const css = `skewX(${(sv * -11).toFixed(2)}deg)`;
        for (const el of skews) el.style.transform = css;
      } else if (sheared) {
        sheared = false;
        for (const el of skews) el.style.transform = "";
      }
    };

    if (fine) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    gsap.ticker.add(tick);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.ticker.remove(tick);
      io.disconnect();
      for (const el of leans.keys()) {
        el.removeAttribute("data-live");
        el.style.removeProperty("--tx");
        el.style.removeProperty("--ty");
      }
      document.querySelectorAll<HTMLElement>("[data-skew]").forEach((el) => (el.style.transform = ""));
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        el.style.removeProperty("--gx");
        el.style.removeProperty("--gy");
      });
    };
  }, [reduce]);

  return null;
}
