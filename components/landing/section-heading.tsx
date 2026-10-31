"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "@/lib/scroll";
import { useGsapScene } from "./scenes/use-gsap-scene";

interface SectionHeadingProps {
  eyebrow: string;
  /** Each entry is one headline line. Lines slide up out of a mask when scrolled into view. */
  lines: string[];
  /** index of the line to render in neon gradient */
  accent?: number;
  align?: "left" | "center";
  className?: string;
  id?: string;
}

export function SectionHeading({ eyebrow, lines, accent, align = "left", className, id }: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGsapScene(ref, (root) => {
    gsap.from(root.querySelectorAll("[data-line]"), {
      yPercent: 115,
      duration: 1,
      ease: "power4.out",
      stagger: 0.12,
      scrollTrigger: { trigger: root, start: "top 88%", once: true },
    });
    gsap.from(root.querySelector("[data-eyebrow]"), {
      opacity: 0,
      x: -16,
      duration: 0.7,
      ease: "power3.out",
      scrollTrigger: { trigger: root, start: "top 90%", once: true },
    });
  });

  return (
    <div ref={ref} className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p data-eyebrow className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-neon-violet">
        <span aria-hidden className="h-px w-8 bg-gradient-to-r from-neon-violet to-transparent" />
        {eyebrow}
      </p>
      <h2 id={id} className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden pb-[0.12em]">
            <span data-line className={cn("block", accent === i && "gradient-text")}>
              {line}
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
}
