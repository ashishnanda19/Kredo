"use client";

import { useLayoutEffect } from "react";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap, registerGsap, scheduleRefresh } from "@/lib/scroll";

/**
 * Section transitions for the landing page. Every `[data-reveal]` block comes into focus as it scrolls in:
 * blurred, faded and slightly low, then sharpening into place (scroll-scrubbed, so it reverses on the way up).
 * Phones skip the blur and only fade and rise. Inside them, the cards of every `[data-stagger]` list land one after
 * another (played once on entry, reversed when scrolled back above).
 * Content wrappers only, never section backgrounds, so colour blocks stay crisp. Off under reduced motion,
 * and the blocks start at opacity 0 (not dimmed) so nothing half-visible is read at the wrong contrast.
 */
export function SectionFx() {
  const reduce = usePrefersReducedMotion();
  useLayoutEffect(() => {
    if (reduce) return;
    registerGsap();
    // blur is the expensive part on phone GPUs: wide, fine-pointer screens get it; phones fade and rise only
    const blur = window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
    // everything here sits far below the fold, so set it up once the browser is idle, not during page load
    let ctx: gsap.Context | undefined;
    const setup = () => {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 72, scale: 0.97, ...(blur && { filter: "blur(10px)" }) },
            { opacity: 1, y: 0, scale: 1, ...(blur && { filter: "blur(0px)" }), ease: "none", clearProps: "filter", scrollTrigger: { trigger: el, start: "top 98%", end: "top 52%", scrub: 0.6 } },
          );
        });
        // section headings: the words rise out of their masks one after another as the heading comes into view
        gsap.utils.toArray<HTMLElement>("[data-words]").forEach((h) => {
          gsap.fromTo(
            h.querySelectorAll("[data-w]"),
            { yPercent: 110 },
            { yPercent: 0, ease: "power4.out", duration: 1, stagger: 0.045, scrollTrigger: { trigger: h, start: "top 88%", toggleActions: "play none none reverse" } },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((list) => {
          gsap.fromTo(
            Array.from(list.children),
            { opacity: 0, y: 48, scale: 0.96, ...(blur && { filter: "blur(6px)" }) },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              ...(blur && { filter: "blur(0px)" }),
              ease: "power3.out",
              duration: 0.9,
              stagger: 0.08,
              clearProps: "filter",
              scrollTrigger: { trigger: list, start: "top 86%", toggleActions: "play none none reverse" },
            },
          );
        });
      });
      scheduleRefresh();
    };
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle ? window.requestIdleCallback(setup, { timeout: 2000 }) : window.setTimeout(setup, 800);
    return () => {
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      ctx?.revert();
    };
  }, [reduce]);
  return null;
}
