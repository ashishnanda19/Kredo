"use client";

import { useRef } from "react";
import { Bell, Check, Gauge, ReceiptText, Wallet } from "lucide-react";
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
    <div data-card className={cn("relative z-10 w-full max-w-[360px] rounded-[22px] bg-elevated p-5 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.4)] ring-1 ring-hairline", className)}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-2">THIS MONTH</p>
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink">All sorted</span>
      </div>
      <ul className="mt-3 divide-y divide-hairline">
        {t.checklist.map((c, i) => (
          <li data-item key={c} className="flex items-center gap-3 py-2.5">
            <span data-tick className="grid size-6 shrink-0 place-items-center rounded-full bg-ok text-white">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[15.5px] font-semibold leading-tight text-ink">{c}</span>
              <span className="block truncate text-[12.5px] text-ink-2">{t.checklistDetail[i]}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-ink-2">{t.calmNote}</p>
    </div>
  );
}

const CALM_ICON = { receipt: ReceiptText, due: Bell, limit: Wallet, score: Gauge } as const;
/** Where the tidy cards settle around the checklist (md and up): left/right side and top %. */
const CALM_SPOTS = [
  { side: "left", top: "10%" },
  { side: "right", top: "16%" },
  { side: "left", top: "56%" },
  { side: "right", top: "62%" },
] as const;

function CalmCard({ i, className, style }: { i: number; className?: string; style?: React.CSSProperties }) {
  const c = COPY.landing.chaos.calmCards[i];
  const Icon = CALM_ICON[c.k as keyof typeof CALM_ICON];
  return (
    <div data-calm className={cn("w-[220px] rounded-[18px] bg-elevated p-3.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.3)] ring-1 ring-hairline", className)} style={style}>
      <p className="flex items-center gap-2 text-[12px] font-semibold text-ink-2">
        <span className="grid size-6 place-items-center rounded-[8px] bg-soft text-ink">
          <Icon className="size-3.5" aria-hidden />
        </span>
        {c.label}
      </p>
      <p className="mt-2 text-[16px] font-semibold tracking-[-0.01em] text-ink">{c.value}</p>
      {c.k === "limit" ? (
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-hairline">
          <span className="block h-full w-[62%] rounded-full bg-ink" />
        </span>
      ) : null}
      <p className="mt-1.5 text-[12px] text-ink-2">{c.note}</p>
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
      // the two headlines and the card overlap in time so the screen is never empty mid-swap
      .to("[data-before]", { opacity: 0, y: -24, filter: "blur(8px)", duration: 0.1 }, 0.26)
      .fromTo("[data-after]", { opacity: 0, y: 24, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.1 }, 0.28)
      .from("[data-card]", { opacity: 0, scale: 0.9, y: 40, duration: 0.14 }, 0.3)
      .fromTo("[data-glow]", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.2 }, 0.42)
      .from("[data-calm]", { opacity: 0, scale: 0.88, y: 24, filter: "blur(10px)", duration: 0.12, stagger: 0.04 }, 0.5)
      .fromTo("[data-calm-line]", { strokeDashoffset: 60, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.12, stagger: 0.03 }, 0.56)
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CALM_SPOTS.map((_, i) => (
                <CalmCard key={i} i={i} className="w-auto" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} aria-labelledby="chaos-title" className="relative h-[240svh] bg-soft-seam">
      <div className="sticky top-[var(--bar-h)] flex h-[calc(100svh-var(--bar-h))] flex-col items-center overflow-hidden px-4 pt-24 sm:pt-28">
        <div data-reveal className="grid text-center">
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
          <div aria-hidden data-glow className="pointer-events-none absolute inset-0 opacity-0">
            <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(55%_55%_at_50%_45%,#000,transparent)]" />
            <div className="absolute left-1/2 top-[45%] size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent)_30%,transparent),transparent)]" />
          </div>
          <svg aria-hidden className="pointer-events-none absolute inset-0 hidden size-full md:block" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[
              [24, 20, 41, 34],
              [76, 26, 59, 34],
              [24, 66, 41, 56],
              [76, 72, 59, 56],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} data-calm-line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-ink-2/40" strokeWidth="1.2" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" fill="none" />
            ))}
          </svg>
          <div aria-hidden className="hidden md:block">
            {CALM_SPOTS.map((spot, i) => (
              <CalmCard key={i} i={i} className="absolute" style={{ [spot.side]: 0, top: spot.top }} />
            ))}
          </div>
          <div className="absolute inset-0 grid place-items-center pb-10">
            <Checklist />
          </div>
        </div>
      </div>
    </section>
  );
}
