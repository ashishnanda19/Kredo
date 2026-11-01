"use client";

import { Fragment, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { useGsapScene } from "./use-gsap-scene";

interface ScrollWordsProps {
  text: string;
  id?: string;
  className?: string;
  /** opacity of a word before it lights up; 0.4 keeps large white-on-black text above 3:1 contrast */
  dim?: number;
}

/**
 * Apple-style scroll reveal for a large headline: words light up one after another as the heading scrolls
 * through the viewport. Fully lit without JS and under reduced motion. Large text only (see `dim`).
 */
export function ScrollWords({ text, id, className, dim = 0.4 }: ScrollWordsProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGsapScene(ref, (root) => {
    gsap.fromTo(
      root.querySelectorAll("[data-w]"),
      { opacity: dim },
      { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: root, start: "top 88%", end: "top 38%", scrub: 0.5 } },
    );
  });
  const words = text.split(" ");
  return (
    <h2 ref={ref} id={id} className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span data-w>{w}</span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </h2>
  );
}
