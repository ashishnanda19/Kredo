"use client";

import { useRef } from "react";
import { gsap } from "@/lib/scroll";
import { useGsapScene } from "./use-gsap-scene";

/**
 * Scroll-scrubbed 3D entrance for decorative devices: each `[data-pop]` child swings up from lying flat
 * (rotateX) and rises into place, one after another. Give each pop target's parent a `perspective`.
 * With `parallax`, a mouse moving over the group shifts every `[data-par]` child by its own depth (--d, in px; the
 * rule is in globals.css), so near devices slide further than far ones. Static and fully visible under reduced motion.
 */
export function PopInGroup({ children, parallax, ...props }: React.HTMLAttributes<HTMLDivElement> & { parallax?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    e.currentTarget.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--px", "0");
    e.currentTarget.style.setProperty("--py", "0");
  };
  useGsapScene(ref, (root) => {
    gsap.fromTo(
      root.querySelectorAll("[data-pop]"),
      { y: 160, rotateX: 68, opacity: 0, transformOrigin: "50% 100%" },
      { y: 0, rotateX: 0, opacity: 1, ease: "power2.out", stagger: 0.09, scrollTrigger: { trigger: root, start: "top 96%", end: "top 40%", scrub: 0.6 } },
    );
  });
  return (
    <div ref={ref} onPointerMove={parallax ? onMove : undefined} onPointerLeave={parallax ? onLeave : undefined} {...props}>
      {children}
    </div>
  );
}
