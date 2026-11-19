"use client";

import { useEffect, useRef } from "react";
import { CampusPayScreen, DuesListScreen, LimitUnlockedScreen, LockScreenReminders, PassportScreen, PayReceiptScreen, PhoneFrame } from "@/components/phone-screens";
import { Reveal } from "@/components/shared/reveal";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { GridField, GridRule } from "./grid-field";
import { TwoTone } from "./two-tone";
import { useGsapScene } from "./use-gsap-scene";

// every card follows the theme (light cards on the light page, dark cards on the dark page)
const LOOK = [
  { bg: "bg-soft text-ink ring-1 ring-hairline", screen: <CampusPayScreen />, tilt: "-rotate-[9deg]", bezel: "#fff" },
  { bg: "bg-card text-ink", screen: <PayReceiptScreen />, tilt: "rotate-[7deg]", bezel: "#fff" },
  { bg: "bg-soft text-ink ring-1 ring-hairline", screen: <LockScreenReminders />, tilt: "-rotate-[6deg]", bezel: "#000" },
  { bg: "bg-card text-ink", screen: <LimitUnlockedScreen />, tilt: "rotate-[9deg]", bezel: "#fff" },
  { bg: "bg-soft text-ink ring-1 ring-hairline", screen: <PassportScreen />, tilt: "-rotate-[7deg]", bezel: "#0A0A0D" },
  { bg: "bg-card text-ink", screen: <DuesListScreen />, tilt: "rotate-[6deg]", bezel: "#fff" },
];

/**
 * A strip of rounded cards, each with a tilted phone rising from the bottom. Scrolls sideways; a mouse can drag it.
 * The row is a carousel in depth: every card turns away from the middle of the screen and sinks back a little the
 * further out it is (--fo and --fa on each item, read by [data-flow] in globals.css), and the cards swing in from
 * the side, fanned out, as the row scrolls into view (--fin). Flat and still under reduced motion.
 */
export function CardStrip() {
  const t = COPY.landing.strip;
  const reduce = usePrefersReducedMotion();
  const scroller = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);

  // where each card sits relative to the middle of the screen: -1 (far left) to 1 (far right)
  useEffect(() => {
    const ul = scroller.current;
    if (!ul || reduce) return;
    const items = Array.from(ul.children) as HTMLElement[];
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = window.innerWidth / 2;
      const reach = Math.max(420, window.innerWidth * 0.75);
      for (const li of items) {
        const r = li.getBoundingClientRect();
        const o = Math.max(-1.2, Math.min(1.2, (r.left + r.width / 2 - mid) / reach));
        li.style.setProperty("--fo", o.toFixed(3));
        li.style.setProperty("--fa", Math.abs(o).toFixed(3));
      }
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    ul.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      ul.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(raf);
      for (const li of items) {
        li.style.removeProperty("--fo");
        li.style.removeProperty("--fa");
      }
    };
  }, [reduce]);

  // the entrance: fanned out and off to the side, the cards close up into the row as it rises through the screen
  useGsapScene(scroller, (root) => {
    gsap.fromTo(root, { "--fin": 1 }, { "--fin": 0, ease: "power2.out", scrollTrigger: { trigger: root, start: "top 96%", end: "top 42%", scrub: 0.7 } });
  });

  return (
    <section aria-labelledby="strip-title" className="relative isolate bg-page py-24 sm:py-32">
      <GridRule />
      <GridField seed={4} className="h-[560px] [mask-image:radial-gradient(55%_65%_at_50%_36%,#000,transparent)]" />
      <div className="mx-auto max-w-[1180px] px-4 text-center sm:px-6">
        <Reveal>
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.28em] text-ink-2">{t.eyebrow}</p>
          <TwoTone id="strip-title" a={t.titleA} b={t.titleB} className="mx-auto mt-5 max-w-2xl" />
          <p className="mx-auto mt-5 max-w-lg text-pretty text-[17px] leading-relaxed text-ink-2">{t.sub}</p>
        </Reveal>
      </div>

      <ul
        ref={scroller}
        aria-label={t.eyebrow}
        className="scrollbar-none mt-14 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1rem,calc((100vw-1180px)/2))] pb-6 active:cursor-grabbing"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !scroller.current) return;
          drag.current = { x: e.clientX, left: scroller.current.scrollLeft };
          scroller.current.style.scrollSnapType = "none";
        }}
        onPointerMove={(e) => {
          if (drag.current && scroller.current) scroller.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
        }}
        onPointerUp={() => {
          drag.current = null;
          if (scroller.current) scroller.current.style.scrollSnapType = "";
        }}
        onPointerLeave={() => {
          drag.current = null;
          if (scroller.current) scroller.current.style.scrollSnapType = "";
        }}
      >
        {t.cards.map((c, i) => {
          const look = LOOK[i];
          return (
            // the item keeps its place in the row (and its snap point); the card inside it is what turns in depth
            <li key={c.a} className="h-[440px] w-[min(82vw,400px)] shrink-0 snap-start select-none" style={{ "--fi": i } as React.CSSProperties}>
              <div data-flow className={cn("group relative flex size-full flex-col overflow-hidden rounded-[28px] p-7", look.bg)}>
                <h3 className="max-w-[16ch] text-[26px] font-semibold leading-[1.05] tracking-[-0.035em]">{c.a}</h3>
                {/* the phone rises from the bottom of this window, cut off cleanly above the caption */}
                <div aria-hidden className="relative -mx-7 mt-3 flex-1 overflow-hidden">
                  <div className={cn("absolute left-1/2 top-5 w-[190px] -translate-x-1/2 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-3", look.tilt)}>
                    <PhoneFrame fill screenBg={look.bezel}>{look.screen}</PhoneFrame>
                  </div>
                </div>
                <p className="pt-4 text-[14px] leading-snug opacity-80">{c.cap}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
