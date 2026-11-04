"use client";

import { useRef } from "react";
import { Bell, Check, Gauge, ReceiptText, Wallet } from "lucide-react";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { useGsapScene } from "./use-gsap-scene";

type FragKind = "bubble" | "bubbleMe" | "note" | "badge" | "slip";

/** Where fragment `i` sits in the mess: [left %, top %, rotate deg]. A loose, deterministic scatter over a 5 x 5 grid. */
/** On phones: two loose columns of the first twelve fragments, so nothing piles up or wraps into tall blobs. */
function spotMobile(i: number): [number, number] {
  const col = i % 2;
  const row = Math.floor(i / 2);
  return [col ? 46 + ((i * 3) % 4) : 2 + ((i * 5) % 5), row * 15 + ((i * 7) % 5)];
}

function spot(i: number): [number, number, number] {
  const col = i % 5;
  const row = Math.floor(i / 5);
  const left = 1 + col * 19 + (row % 2 ? 7 : 0) + ((i * 7) % 5);
  const top = row * 19 + ((i * 11) % 8);
  return [Math.min(left, 78), top, ((i * 37) % 17) - 8];
}

const FRAG_STYLE = {
  bubble: "rounded-[18px] rounded-bl-[6px] bg-elevated text-ink ring-1 ring-hairline",
  bubbleMe: "rounded-[18px] rounded-br-[6px] bg-info text-white",
  note: "rounded-[4px] bg-accent text-accent-ink font-semibold [font-family:ui-rounded,system-ui]",
  badge: "rounded-full bg-bad text-white font-bold",
  slip: "rounded-[6px] bg-elevated font-mono text-[12px] text-ink-2 ring-1 ring-hairline border-t-2 border-dashed border-ink/20",
} as const;

function Fragment({ text, kind, i, className, style }: { text: string; kind: FragKind; i: number; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      data-frag
      className={cn("absolute inline-block max-w-[50vw] px-3 py-1.5 text-[12.5px] leading-snug shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] left-[var(--ml)] top-[var(--mt)] sm:left-[var(--l)] sm:top-[var(--t)] sm:max-w-[220px] sm:px-3.5 sm:py-2 sm:text-[13.5px]", i >= 12 && "max-sm:hidden", FRAG_STYLE[kind], className)}
      style={style}
    >
      <span className="block motion-safe:animate-[float-y_var(--d)_ease-in-out_var(--dl)_infinite]" style={{ "--d": `${4 + (i % 5) * 0.7}s`, "--dl": `${-(i % 7) * 0.6}s` } as React.CSSProperties}>
        {text}
      </span>
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
    const meter = { v: 100 };
    const num = root.querySelector<HTMLElement>("[data-meter-num]");
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
      stagger: 0.012,
      duration: 0.4,
    })
      // the two headlines and the card overlap in time so the screen is never empty mid-swap
      // the chaos meter drains in step with the fragments, so every message that collapses lowers it a little
      .to("[data-meter-bar]", { scaleX: 0, backgroundColor: "var(--ok-fill)", duration: 0.68, ease: "none" }, 0)
      .to(meter, { v: 0, duration: 0.68, ease: "none", onUpdate: () => { if (num) num.textContent = `${Math.round(meter.v)}%`; } }, 0)
      .to("[data-meter-before]", { opacity: 0, duration: 0.05 }, 0.68)
      .to("[data-meter-after]", { opacity: 1, duration: 0.05 }, 0.7)
      .to("[data-before]", { opacity: 0, y: -24, filter: "blur(8px)", duration: 0.1 }, 0.26)
      .fromTo("[data-after]", { opacity: 0, y: 24, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.1 }, 0.28)
      .from("[data-card]", { opacity: 0, scale: 0.9, y: 40, duration: 0.14 }, 0.3)
      .fromTo("[data-glow]", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.2 }, 0.42)
      .from("[data-calm]", { opacity: 0, scale: 0.88, y: 24, filter: "blur(10px)", duration: 0.12, stagger: 0.04 }, 0.5)
      .fromTo("[data-calm-line]", { strokeDashoffset: 60, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.12, stagger: 0.03 }, 0.56)
      .from("[data-item]", { opacity: 0.25, duration: 0.05, stagger: 0.045 }, 0.62)
      .from("[data-tick]", { scale: 0, duration: 0.05, stagger: 0.045 }, 0.62)
      .to({}, { duration: 0.04 });
  });

  if (reduce) {
    return (
      <section aria-labelledby="chaos-title" className="bg-soft py-24">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <h2 id="chaos-title" className="text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">{t.before}</h2>
            <p className="mt-3 text-ink-2">{t.beforeSub}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {t.fragments.map((f) => (
                <li key={f.t} className={cn("px-3 py-1.5 text-[13px]", FRAG_STYLE[f.k])}>{f.t}</li>
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
    <section ref={ref} aria-labelledby="chaos-title" className="relative h-[220svh] bg-soft-seam">
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
        <div data-meter className="mt-5 w-full max-w-[360px]">
          <div className="relative h-5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-2">
            <span data-meter-before className="absolute inset-x-0">{t.meterBefore} <span data-meter-num className="tabular-nums">100%</span></span>
            <span data-meter-after className="absolute inset-x-0 opacity-0">{t.meterAfter}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-hairline">
            <span data-meter-bar className="block h-full w-full origin-left rounded-full bg-bad" />
          </div>
        </div>
        <div data-stage className="relative mt-6 w-full max-w-[920px] flex-1">
          <div aria-hidden>
            {t.fragments.map((f, i) => {
              const [l, top, rot] = spot(i);
              const [ml, mt] = spotMobile(i);
              return <Fragment key={f.t} i={i} text={f.t} kind={f.k} style={{ "--l": `${l}%`, "--t": `${top}%`, "--ml": `${ml}%`, "--mt": `${mt}%`, transform: `rotate(${rot}deg)` } as React.CSSProperties} />;
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
