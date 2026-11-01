"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { useGsapScene } from "./use-gsap-scene";

/**
 * The footer's sign-off: the slogan in giant, softly lit type, cropped by the bottom edge. Letters rise out of a
 * blur when the slogan comes into view. Also tells the footer whether it fits the viewport (`data-fit`), which is
 * what enables the curtain reveal, so a tall footer never ends up partly unreachable.
 */
export function FooterSlogan({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const footer = ref.current?.closest("footer");
    if (!footer) return;
    const fit = () => footer.toggleAttribute("data-fit", footer.offsetHeight <= window.innerHeight - 24);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(footer);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  // plays when the slogan is actually on screen (an observer, not scroll maths, so the sticky curtain cannot confuse it)
  useGsapScene(ref, (root) => {
    const tl = gsap
      .timeline({ paused: true })
      .fromTo(root.querySelectorAll("[data-ch]"), { yPercent: 70, opacity: 0, filter: "blur(10px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", ease: "power3.out", duration: 1.1, stagger: 0.045 });
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.reverse()), { threshold: 0.35 });
    io.observe(root);
    return () => io.disconnect();
  });

  const body = text.replace(/\.$/, "");
  return (
    <div ref={ref} className="relative mt-8 h-[0.8em] select-none overflow-hidden text-[min(10.6vw,128px)] font-semibold leading-[0.82] tracking-[-0.055em] sm:mt-10">
      <p className="sr-only">{text}</p>
      <p aria-hidden className="whitespace-nowrap">
        {[...body].map((ch, i) => (
          <span
            key={i}
            data-ch
            className="inline-block bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.04)_85%)] bg-clip-text text-transparent"
          >
            {ch === " " ? "\u00a0" : ch}
          </span>
        ))}
        <span data-ch className="inline-block text-accent">
          .
        </span>
      </p>
    </div>
  );
}
