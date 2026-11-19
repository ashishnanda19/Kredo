"use client";

import { useRef } from "react";
import { gsap } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { useGsapScene } from "./use-gsap-scene";

/**
 * A device that turns in 3D with the scroll: it comes in angled away, swings round to face the reader as its section
 * crosses the screen, and carries on a few degrees past, while a band of light slides across its glass. Scrubbed, so
 * it runs backwards on the way up. Still and square-on under reduced motion. Wrap one phone (aspect 1 : 2.14).
 */
export function TurnIn({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGsapScene(ref, (root) => {
    const st = { trigger: root, start: "top 96%", end: "bottom 8%", scrub: 0.8 };
    gsap.fromTo(root.querySelector("[data-turn]"), { rotateY: -34, rotateX: 9, z: -90 }, { rotateY: 9, rotateX: -3, z: 0, ease: "none", scrollTrigger: st });
    gsap.fromTo(root.querySelector("[data-glare]"), { xPercent: -160, opacity: 1 }, { xPercent: 260, opacity: 1, ease: "none", scrollTrigger: st });
  });
  return (
    <div ref={ref} className={cn("[perspective:1500px]", className)}>
      <div data-turn className="relative">
        {children}
        {/* the glass: the same inset and corners as the phone frame's screen */}
        <span aria-hidden className="pointer-events-none absolute inset-[2.6%_3.6%] overflow-hidden rounded-[13%/6%]">
          <span data-glare className="absolute inset-y-[-10%] left-0 w-[45%] -skew-x-[18deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] opacity-0" />
        </span>
      </div>
    </div>
  );
}
