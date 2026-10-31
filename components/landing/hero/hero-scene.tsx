"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Landmark, ShieldCheck } from "lucide-react";
import { CampusPayScreen, DuesListScreen, LimitUnlockedScreen, LockScreenReminders, PassportScreen, ScaledScreen, VerifyScreen } from "@/components/phone-screens";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { registerGsap, scrollToY, ScrollTrigger } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { EmailPill } from "../sections/email-pill";
import { HandPhone } from "./hand-phone";
import { NotificationFeed, type FeedStage } from "./notification-feed";
import { StageSegmented } from "./stage-segmented";

type Step =
  | { stage: 0; screen: "verify"; phase: "pending" | "accepted" }
  | { stage: 0; screen: "limit" }
  | { stage: 1; screen: "pay"; phase: "sheet" | "paid" }
  | { stage: 2; screen: "dues" | "passport" }
  | { stage: 3; screen: "lock" };

/** What the phone shows as the scroll moves through each stage. */
const STEPS: Step[] = [
  { stage: 0, screen: "verify", phase: "pending" },
  { stage: 0, screen: "verify", phase: "accepted" },
  { stage: 0, screen: "limit" },
  { stage: 1, screen: "pay", phase: "sheet" },
  { stage: 1, screen: "pay", phase: "paid" },
  { stage: 2, screen: "dues" },
  { stage: 2, screen: "passport" },
  { stage: 3, screen: "lock" },
];
const STAGE_COUNT = 4;
const stepsOf = (stage: number) => STEPS.map((s, i) => [s, i] as const).filter(([s]) => s.stage === stage).map(([, i]) => i);
const FEED: (FeedStage | null)[] = ["verify", "campus", "repay", null];
const DARK_FROM = 2;

function screenFor(s: Step) {
  switch (s.screen) {
    case "verify": return <VerifyScreen phase={s.phase} />;
    case "limit": return <LimitUnlockedScreen />;
    case "pay": return <CampusPayScreen phase={s.phase} />;
    case "dues": return <DuesListScreen />;
    case "passport": return <PassportScreen />;
    case "lock": return <LockScreenReminders />;
  }
}

/** iOS-style push: the new screen slides in from the right over the old one, which drifts left and dims. */
const push = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-28%", opacity: d > 0 ? 1 : 0.6, zIndex: d > 0 ? 2 : 0 }),
  center: { x: "0%", opacity: 1, zIndex: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-28%" : "100%", opacity: d > 0 ? 0.6 : 1, zIndex: d > 0 ? 0 : 2 }),
};

/** L1: faint card outlines drifting behind the phone on the dark stages. */
function GhostFragments({ on }: { on: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 transition-opacity duration-700", on ? "opacity-100" : "opacity-0")}>
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(190,180,255,.35)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(60%_55%_at_50%_60%,#000,transparent)]" />
      {[[6, 30, 190], [80, 24, 210], [4, 78, 170], [84, 74, 180]].map(([l, t, w], i) => (
        <span
          key={i}
          className="absolute flex h-14 items-center gap-3 rounded-[16px] bg-white/[.03] px-3 opacity-60 ring-1 ring-white/[.06] [animation:ghost-drift_14s_ease-in-out_infinite_alternate] motion-reduce:animate-none"
          style={{ left: `${l}%`, top: `${t}%`, width: w, animationDelay: `${i * -2.6}s` }}
        >
          <span className="size-8 shrink-0 rounded-[9px] bg-white/[.06]" />
          <span className="flex-1 space-y-1.5"><span className="block h-2 w-3/4 rounded bg-white/[.08]" /><span className="block h-2 w-1/2 rounded bg-white/[.05]" /></span>
        </span>
      ))}
    </div>
  );
}

/**
 * F3–F6 hero. The section is several screens tall; its inner stage is sticky (the "pin"), and scroll progress
 * (ScrollTrigger over Lenis) picks the stage, the phone screen and how many feed cards are lit. The segmented
 * control scrolls to a stage. From "Repay and grow" on, the background shifts to deep indigo and the nav inverts.
 * Under reduced motion there is no pin: the control simply switches stages in place.
 */
export function HeroScene() {
  const t = COPY.landing;
  const reduce = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ step: 0, lit: 1, dir: 1 });
  const stage = STEPS[state.step].stage;
  const dark = stage >= DARK_FROM;
  const panelId = "hero-stage-panel";

  const apply = useCallback((p: number) => {
    const sg = Math.min(STAGE_COUNT - 1, Math.floor(p * STAGE_COUNT));
    const local = Math.min(1, p * STAGE_COUNT - sg);
    const ids = stepsOf(sg);
    const step = ids[Math.min(ids.length - 1, Math.floor(local * ids.length))];
    const lit = Math.max(1, Math.min(6, Math.ceil(local * 7.2)));
    setState((prev) => (prev.step === step && prev.lit === lit ? prev : { step, lit, dir: step >= prev.step ? 1 : -1 }));
  }, []);

  // the pin: map scroll progress through the tall section to steps
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el || reduce) return;
    registerGsap();
    const st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", onUpdate: (self) => apply(self.progress) });
    apply(st.progress);
    return () => st.kill();
  }, [reduce, apply]);

  // size the hand-phone to the space left under the headline (CSS var, no re-render)
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      // let the phone run a little past the fold (Flighty-style); the floating control overlaps the hand, not the UI
      // (the art box has empty space above the phone, so it is pulled up by 9% of its width)
      const pw = Math.max(320, Math.min((height + 8) / 0.89, width * 1.3, width >= 1024 ? 760 : 620));
      el.style.setProperty("--pw", `${Math.round(pw)}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const select = (i: number) => {
    const el = sectionRef.current;
    if (reduce || !el) {
      const ids = stepsOf(i);
      setState((prev) => ({ step: ids[ids.length - 1], lit: 6, dir: ids[0] >= prev.step ? 1 : -1 }));
      return;
    }
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    scrollToY(top + (i === 0 ? 0 : ((i + 0.02) / STAGE_COUNT) * span));
  };

  // pointer tilt (fine pointers only)
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 18 });
  const sry = useSpring(ry, { stiffness: 120, damping: 18 });
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 7);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 5);
  };
  const onPointerLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const cur = STEPS[state.step];
  const feed = FEED[stage];

  return (
    <section ref={sectionRef} id="how" aria-label={t.hero.title} className={cn("relative", !reduce && "h-[460svh]")}>
      <div
        data-nav-theme={dark ? "dark" : "light"}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className={cn("overflow-hidden", reduce ? "relative min-h-[calc(100svh-var(--bar-h))]" : "sticky top-[var(--bar-h)] h-[calc(100svh-var(--bar-h))]", dark ? "text-white" : "text-ink")}
      >
        {/* L0: page, shifting to indigo */}
        <div aria-hidden className="absolute inset-0 bg-page" />
        <div
          aria-hidden
          className={cn("absolute inset-0 transition-opacity duration-700 ease-out", dark ? "opacity-100" : "opacity-0")}
          style={{ background: "radial-gradient(70% 60% at 50% 75%, #3a1fb8 0%, rgba(58,31,184,0) 70%), linear-gradient(180deg,#07051a 0%,#120a3f 60%,#1d0f63 100%)" }}
        />
        <GhostFragments on={dark} />

        <div className="relative flex h-full flex-col items-center pt-[80px] sm:pt-[88px]">
          {/* L6 copy: every stage's text shares one grid cell so the phone never jumps */}
          <div id={panelId} role="tabpanel" className="grid w-full max-w-6xl px-4 text-center">
            {t.stages.map((s, i) => {
              const on = i === stage;
              return (
                <div
                  key={s.id}
                  aria-hidden={!on}
                  className={cn(
                    "col-start-1 row-start-1 flex flex-col items-center transition-[opacity,transform,visibility] duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
                    on ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0",
                  )}
                >
                  {i === 0 ? (
                    <>
                      <h1 className="text-balance text-[clamp(2.4rem,5.8vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.045em]">{t.hero.title}</h1>
                      <p className={cn("mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed sm:text-[17px]", dark ? "text-white/70" : "text-ink-2")}>{t.hero.sub}</p>
                      <ul className="mt-3.5 flex flex-wrap justify-center gap-x-6 gap-y-2">
                        {t.hero.badges.map((b, j) => {
                          const Icon = j === 0 ? ShieldCheck : Landmark;
                          return (
                            <li key={b.title} className="flex items-center gap-2 text-left">
                              <Icon className="size-5 shrink-0" aria-hidden />
                              <span className="leading-tight">
                                <span className="block text-[13px] font-semibold">{b.title}</span>
                                <span className={cn("block text-[11.5px]", dark ? "text-white/60" : "text-ink-2")}>{b.sub}</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <>
                      <h2 className="text-balance text-[clamp(2.2rem,5.8vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.045em]">{s.title}</h2>
                      {s.id === "access" ? (
                        <EmailPill dark className="mt-5 w-full max-w-md" />
                      ) : (
                        <p className={cn("mt-3 max-w-xl text-pretty text-[15px] leading-relaxed sm:text-[17px]", i >= DARK_FROM ? "text-white/70" : "text-ink-2")}>{s.body}</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* phone area: feed (L2), hand + phone (L3–L5) */}
          <div ref={areaRef} className="relative mt-5 w-full flex-1 [--pw:min(560px,calc(100svh-300px))] sm:mt-6">
            {feed && <NotificationFeed stage={feed} lit={reduce ? 6 : state.lit} dark={dark} />}
            <div className="absolute left-1/2 top-[calc(var(--pw)*-0.09)] -translate-x-1/2 [perspective:1400px]" style={{ width: "var(--pw)" }}>
              <div className="anim-rise">
              <motion.div style={{ rotateX: srx, rotateY: sry }}>
                <HandPhone dark={dark}>
                  <div role="img" aria-label={`${t.hero.phoneAlt}: ${t.stages[stage].label}`} className="size-full">
                    <ScaledScreen bg={dark ? "#0A0620" : "#fff"}>
                      <div className="relative size-full" aria-hidden>
                        <AnimatePresence initial={false} custom={state.dir}>
                          <motion.div
                            key={cur.screen}
                            custom={state.dir}
                            variants={push}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                            className="absolute inset-0"
                          >
                            {screenFor(cur)}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </ScaledScreen>
                  </div>
                </HandPhone>
              </motion.div>
              </div>
            </div>
            <p className={cn("absolute inset-x-0 bottom-[70px] z-10 text-center text-[11px] leading-snug sm:inset-x-auto sm:bottom-[84px] sm:left-6 sm:text-left", dark ? "text-white/60" : "text-ink-2")}>{t.hero.sample}</p>
          </div>

          <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-3 sm:bottom-6">
            <StageSegmented stages={t.stages} active={stage} onSelect={select} panelId={panelId} />
          </div>
        </div>
      </div>
    </section>
  );
}
