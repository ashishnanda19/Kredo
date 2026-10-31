"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/scroll";
import { cardRig } from "./card-rig";

/**
 * Feeds the card rig with pointer input:
 *  - desktop: cursor position (card tilts toward the cursor, damped by the renderer)
 *  - touch / pen: horizontal drag on the hero card slot rotates the card, springing back on release
 */
export function useRigPointer() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      cardRig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      cardRig.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    const slot = document.querySelector<HTMLElement>("[data-hero-card-slot]");
    let startX = 0;
    let base = 0;
    let dragging = false;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      dragging = true;
      startX = e.clientX;
      base = cardRig.drag.y;
      gsap.killTweensOf(cardRig.drag);
      slot?.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      cardRig.drag.y = base + (e.clientX - startX) * 0.012;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      gsap.to(cardRig.drag, { y: 0, duration: 1.2, ease: "elastic.out(1, 0.5)" });
    };
    slot?.addEventListener("pointerdown", down);
    slot?.addEventListener("pointermove", move);
    slot?.addEventListener("pointerup", up);
    slot?.addEventListener("pointercancel", up);

    return () => {
      window.removeEventListener("pointermove", onMove);
      slot?.removeEventListener("pointerdown", down);
      slot?.removeEventListener("pointermove", move);
      slot?.removeEventListener("pointerup", up);
      slot?.removeEventListener("pointercancel", up);
    };
  }, []);
}
