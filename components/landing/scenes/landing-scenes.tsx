"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePrefersReducedMotion } from "@/lib/quality";
import { createSmoothScroll, gsap, scheduleRefresh, ScrollTrigger } from "@/lib/scroll";
import { cardRig, measureHeroPose, resetRig, rigReady } from "./card-rig";
import { CardStage } from "./card-stage";
import { useRigPointer } from "./use-rig-pointer";

/**
 * Landing-page scroll orchestrator (mounted once on `/`):
 *  - Lenis smooth scrolling on a shared RAF with GSAP's ticker, synced to ScrollTrigger
 *  - parallax for the ambient orbs
 *  - the persistent card (WebGL, or CSS fallback) driven by the card rig
 * Individual scenes (headings, pinned steps, vendor strip, sweeps) register their own triggers.
 * Under prefers-reduced-motion none of it runs and the page is plain, static content.
 */
export function LandingScenes() {
  const reduce = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduce) return;
    resetRig();
    Object.assign(cardRig.pose, measureHeroPose());

    const stopScroll = createSmoothScroll();

    // parallax: orbs drift at different speeds across the whole page
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax ?? "0");
        gsap.to(el, {
          y: () => speed * document.documentElement.scrollHeight * 0.35,
          ease: "none",
          scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true },
        });
      });
    });

    // lazy sections change page height as they mount: keep triggers honest
    const ro = new ResizeObserver(() => scheduleRefresh(200));
    ro.observe(document.body);
    void document.fonts?.ready.then(() => scheduleRefresh(50));

    return () => {
      rigReady.set(false);
      ro.disconnect();
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      stopScroll();
    };
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const onResize = () => {
      // keep the hero pose honest when nothing has scrolled yet
      if (window.scrollY < 4) Object.assign(cardRig.pose, measureHeroPose());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [reduce]);

  useRigPointer();

  return reduce ? null : <CardStage />;
}
