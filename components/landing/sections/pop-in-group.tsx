"use client";

import { useRef } from "react";
import { gsap } from "@/lib/scroll";
import { useGsapScene } from "./use-gsap-scene";

/**
 * Scroll-scrubbed 3D entrance for decorative devices: each `[data-pop]` child swings up from lying flat
 * (rotateX) and rises into place, one after another. Give each pop target's parent a `perspective`.
 * Static and fully visible under reduced motion.
 */
export function PopInGroup({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useGsapScene(ref, (root) => {
    gsap.fromTo(
      root.querySelectorAll("[data-pop]"),
      { y: 160, rotateX: 68, opacity: 0, transformOrigin: "50% 100%" },
      { y: 0, rotateX: 0, opacity: 1, ease: "power2.out", stagger: 0.09, scrollTrigger: { trigger: root, start: "top 96%", end: "top 40%", scrub: 0.6 } },
    );
  });
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}
