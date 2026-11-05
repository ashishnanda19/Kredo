"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CampusPayScreen, DuesListScreen, LimitUnlockedScreen, LockScreenReminders, PayReceiptScreen, PhoneFrame } from "@/components/phone-screens";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { cn } from "@/lib/utils";
import { useGsapScene } from "./use-gsap-scene";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

const SCREENS = [<LimitUnlockedScreen key="limit" />, <CampusPayScreen key="pay" />, <LockScreenReminders key="remind" />, <DuesListScreen key="dues" />, <PayReceiptScreen key="receipt" />];

function Copy({ i }: { i: number }) {
  const it = COPY.landing.scenes.items[i];
  return (
    <>
      <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.28em] text-ink-2">{it.eyebrow}</p>
      <h2 className="mt-5 text-balance text-[clamp(2.2rem,4.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
        <span className="text-ink">{it.a}</span> <span className="text-ink-2/80">{it.b}</span>
      </h2>
      <p className="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-ink-2">{it.body}</p>
    </>
  );
}

/**
 * Scene-by-scene storytelling. The section is tall and its stage is sticky on every screen size: one phone resting on the desk stays
 * put while five scenes swap beside it (text rises in, the screen pops over the last), and a thin rail on the edge
 * tracks progress. Reduced motion gets a plain stack of the same five scenes.
 */
export function ScenesStage() {
  const t = COPY.landing.scenes;
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const [idx, setIdx] = useState(0);

  useGsapScene(ref, (root) => {
    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setIdx(Math.min(t.items.length - 1, Math.floor(self.progress * t.items.length)));
        if (thumb.current) thumb.current.style.top = `calc((100% - 2rem) * ${self.progress})`;
      },
    });
  });

  return (
    <section ref={ref} aria-label="Kredo, scene by scene" className={cn("relative bg-page", !reduce && "h-[520svh]")}>
      {/* wide, motion on: the sticky stage */}
      {!reduce && (
        <div className="sticky top-0 h-svh overflow-hidden">
          {/* the desk, graded like a photo set: slightly soft focus, warm and a touch muted, with a spotlight on the phone, a vignette and fine grain */}
          <Image src="/hero/desk.jpg" alt="" fill sizes="100vw" quality={70} className="scale-[1.04] object-cover object-[68%_center] blur-[2.5px] saturate-[.9] lg:object-center" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(48%_62%_at_72%_62%,rgba(255,244,226,.55),transparent_72%)] mix-blend-soft-light" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(130%_100%_at_62%_58%,transparent_52%,rgba(24,18,10,.34)_100%)]" />
          <div aria-hidden className="absolute inset-0 opacity-[.16] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,var(--page)_0%,color-mix(in_oklab,var(--page)_92%,transparent)_30%,color-mix(in_oklab,var(--page)_20%,transparent)_58%,transparent_100%)] lg:bg-[linear-gradient(90deg,var(--page)_0%,color-mix(in_oklab,var(--page)_88%,transparent)_34%,color-mix(in_oklab,var(--page)_30%,transparent)_70%,transparent_100%)]" />
          <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-page to-transparent" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-page to-transparent" />

          <div className="relative mx-auto flex h-full max-w-[1180px] flex-col px-5 pb-[4svh] pt-[88px] sm:px-6 lg:grid lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-10 lg:p-0 lg:px-6">
            <div key={idx} className="min-h-[200px] shrink-0 animate-[scene-in_0.7s_cubic-bezier(.16,1,.3,1)_both]">
              <Copy i={idx} />
            </div>
            {/* bottom-aligned so the phone lies low on the desk and the headphones stay visible behind it */}
            <div className="relative grid min-h-0 flex-1 content-end justify-items-center lg:h-full lg:pb-[6svh]">
              {/* flat on the desk: barely turned, and lit from the upper left so the shadow is short and tight on the lower right (no blur underneath, so it cannot look like it hovers) */}
              <div className="relative [--ph:calc(min(44svh,420px)/2.14)] lg:[--ph:calc(56svh/2.14)]" style={{ width: "var(--ph)" }}>
                <div className="relative [transform:rotate(-1.5deg)] [filter:drop-shadow(5px_7px_4px_rgba(0,0,0,0.55))_drop-shadow(14px_20px_18px_rgba(0,0,0,0.35))]">
                  <PhoneFrame flat>
                    <div className="relative size-full">
                      <AnimatePresence initial={false}>
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.96, y: 24 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 1.02, y: -16 }}
                          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0"
                        >
                          {SCREENS[idx]}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </PhoneFrame>
                </div>
              </div>
            </div>
          </div>

          {/* progress rail */}
          <div role="img" aria-label={`${t.railLabel}: ${idx + 1} of ${t.items.length}`} className="absolute right-2 top-1/2 h-32 sm:right-6 lg:h-44 w-1.5 -translate-y-1/2 rounded-full bg-ink/10">
            <span ref={thumb} className="absolute left-1/2 top-0 h-8 w-3.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_2px_10px_-2px_rgba(0,0,0,0.35)] ring-1 ring-ink/10" />
          </div>
        </div>
      )}

      {/* phones, or reduced motion: the same scenes stacked */}
      <div className={cn("mx-auto max-w-[1180px] px-4 py-20 sm:px-6", !reduce && "hidden")}>
        <ul className="space-y-20">
          {t.items.map((_, i) => (
            <li key={i} className="grid items-center gap-8 md:grid-cols-2">
              <div className="md:order-first">
                <Copy i={i} />
              </div>
              <div className="mx-auto w-[min(230px,60vw)]">
                <PhoneFrame>{SCREENS[i]}</PhoneFrame>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
