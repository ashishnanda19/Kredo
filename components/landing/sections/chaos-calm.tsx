"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { useGsapScene } from "./use-gsap-scene";

/** Where each fragment sits in the mess: [left %, top %, rotate deg, style]. */
const SPOTS: [number, number, number, "bubble" | "bubbleMe" | "note" | "badge" | "slip"][] = [
  [4, 8, -6, "note"], [62, 4, 5, "bubble"], [30, 18, -3, "slip"], [74, 30, 8, "badge"], [8, 40, 4, "bubbleMe"], [44, 44, -7, "bubble"],
  [70, 58, -4, "slip"], [16, 70, 7, "badge"], [48, 74, 3, "note"], [80, 82, -8, "bubbleMe"], [2, 88, -2, "slip"],
];

const FRAG_STYLE = {
  bubble: "rounded-[18px] rounded-bl-[6px] bg-elevated text-ink ring-1 ring-hairline",
  bubbleMe: "rounded-[18px] rounded-br-[6px] bg-info text-white",
  note: "rounded-[4px] bg-accent text-accent-ink font-semibold [font-family:ui-rounded,system-ui]",
  badge: "rounded-full bg-bad text-white font-bold",
  slip: "rounded-[6px] bg-elevated font-mono text-[12px] text-ink-2 ring-1 ring-hairline border-t-2 border-dashed border-ink/20",
} as const;

function Fragment({ text, kind, className, style }: { text: string; kind: keyof typeof FRAG_STYLE; className?: string; style?: React.CSSProperties }) {
  return (
    <span data-frag className={cn("absolute inline-block max-w-[220px] px-3.5 py-2 text-[13.5px] leading-snug shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]", FRAG_STYLE[kind], className)} style={style}>
      {text}
    </span>
  );
}

function Checklist({ className }: { className?: string }) {
  const t = COPY.landing.chaos;
  return (
    <div data-card className={cn("w-full max-w-[340px] rounded-[20px] bg-elevated p-5 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.35)] ring-1 ring-hairline", className)}>
      <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-2">THIS MONTH</p>
      <ul className="mt-3 space-y-1">
        {t.checklist.map((c) => (
          <li data-item key={c} className="flex items-center gap-3 rounded-[12px] px-2 py-2.5 text-[16px] font-semibold text-ink">
            <span data-tick className="grid size-6 place-items-center rounded-full bg-ok text-white">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            </span>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ramp-style "chaos to calm". Scattered money fragments (IOUs, pending bills, declined cards) collapse as you
 * scroll and a single tidy checklist takes their place. Pinned on a tall section with a scrubbed GSAP timeline.
 * Reduced motion gets a static before/after pair instead.
 */
export function ChaosCalm() {
  const t = COPY.landing.chaos;
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useGsapScene(ref, (root) => {
    const stage = root.querySelector<HTMLElement>("[data-stage]")!;
    const frags = gsap.utils.toArray<HTMLElement>("[data-frag]", root);
    const s = stage.getBoundingClientRect();
    const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.6 } });
    tl.to(frags, {
      x: (_, el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return s.left + s.width / 2 - (r.left + r.width / 2);
      },
      y: (_, el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return s.top + s.height / 2 - (r.top + r.height / 2);
      },
      rotation: 0,
      scale: 0.4,
      opacity: 0,
      stagger: 0.03,
      duration: 0.5,
    })
      .to("[data-before]", { opacity: 0, y: -24, duration: 0.1 }, 0.28)
      .fromTo("[data-after]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.1 }, 0.4)
      .from("[data-card]", { opacity: 0, scale: 0.9, y: 40, duration: 0.16 }, 0.4)
      .from("[data-item]", { opacity: 0.25, duration: 0.05, stagger: 0.045 }, 0.62)
      .from("[data-tick]", { scale: 0, duration: 0.05, stagger: 0.045 }, 0.62)
      .to({}, { duration: 0.12 }); // hold the finished checklist before the section scrolls away
  });

  if (reduce) {
    return (
      <section aria-labelledby="chaos-title" className="bg-soft py-24">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <h2 id="chaos-title" className="text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">{t.before}</h2>
            <p className="mt-3 text-ink-2">{t.beforeSub}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {t.fragments.map((f, i) => (
                <li key={f} className={cn("px-3 py-1.5 text-[13px]", FRAG_STYLE[SPOTS[i % SPOTS.length][3]])}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">{t.after}</p>
            <p className="mt-3 text-ink-2">{t.afterSub}</p>
            <Checklist className="mt-6" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} aria-labelledby="chaos-title" className="relative h-[240svh] bg-soft">
      <div className="sticky top-[var(--bar-h)] flex h-[calc(100svh-var(--bar-h))] flex-col items-center overflow-hidden px-4 pt-24 sm:pt-28">
        <div className="grid text-center">
          <div data-before className="col-start-1 row-start-1">
            <h2 id="chaos-title" className="text-balance text-[clamp(1.9rem,4.4vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{t.before}</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-2">{t.beforeSub}</p>
          </div>
          <div data-after className="col-start-1 row-start-1 opacity-0">
            <p className="text-balance text-[clamp(1.9rem,4.4vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{t.after}</p>
            <p className="mx-auto mt-3 max-w-md text-ink-2">{t.afterSub}</p>
          </div>
        </div>
        <div data-stage className="relative mt-8 w-full max-w-[920px] flex-1">
          <div aria-hidden>
            {t.fragments.map((f, i) => {
              const [l, top, rot, kind] = SPOTS[i % SPOTS.length];
              return <Fragment key={f} text={f} kind={kind} style={{ left: `${l}%`, top: `${top * 0.82}%`, transform: `rotate(${rot}deg)` }} />;
            })}
          </div>
          <div className="absolute inset-0 grid place-items-center pb-10">
            <Checklist />
          </div>
        </div>
      </div>
    </section>
  );
}
