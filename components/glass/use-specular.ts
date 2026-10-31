"use client";

import { useEffect, type RefObject } from "react";

/**
 * Specular sheen: a soft highlight that follows the pointer across glass (desktop / fine pointer only).
 * Writes CSS variables directly (no React re-render). See `.glass::after` in globals.css.
 */
export function useSpecular(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
      el.style.setProperty("--spec", "1");
    };
    const leave = () => el.style.setProperty("--spec", "0");

    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [ref]);
}
