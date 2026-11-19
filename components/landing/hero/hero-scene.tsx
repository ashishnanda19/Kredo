"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  type MotionValue,
  useSpring,
} from "framer-motion";
import { Landmark, ShieldCheck } from "lucide-react";
import {
  AppShot,
  preloadAppShots,
  ScaledScreen,
  ScrollPayScreen,
} from "@/components/phone-screens";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap, registerGsap, scrollToY, ScrollTrigger } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { EmailPill } from "../sections/email-pill";
import { HandPhone } from "./hand-phone";
import { HeroSplash } from "./hero-splash";
import { StageSegmented } from "./stage-segmented";

type Step =
  | { stage: 0; screen: "unlocked" }
  | { stage: 1; screen: "pay" }
  | { stage: 2; screen: "repay" }
  | { stage: 3; screen: "home" };

/** What the phone shows as the scroll moves through each stage. */
const STEPS: Step[] = [
  // four screens in all, none repeated: the limit that unlocks, the payment (its slider and the paid pop follow the scroll
  // inside the one step, see ScrollPayScreen), the repay screen, then the app's home for "Get access"
  { stage: 0, screen: "unlocked" },
  { stage: 1, screen: "pay" },
  { stage: 2, screen: "repay" },
  { stage: 3, screen: "home" },
];
const STAGE_COUNT = 4;
const stepsOf = (stage: number) =>
  STEPS.map((s, i) => [s, i] as const)
    .filter(([s]) => s.stage === stage)
    .map(([, i]) => i);
const DARK_FROM = 2;
/** The last stage settles to near-black so the hero runs straight into the dark sections below it. */
const NIGHT = 3;
/** Share of the pinned scroll spent on the yellow splash: the payment story, then the wipe to white. */
const SPLASH = 0.22;
/** Share spent on the intro (headline first, then the phone swings up out of the page). */
const INTRO = 0.13;
/** The workflow, drawn huge and faint behind the phone on the dark stages. */
const HERO_WORDS = ["Verify", "Pay", "Settle", "Repay", "Grow"];

/** Everything before the four stages. */
const OPEN = SPLASH + INTRO;
/** Intro start values; keep in step with the [data-intro-*] rules in globals.css. */
const introFrom = () => {
  const small = window.innerWidth < 640;
  return {
    title: {
      y: window.innerHeight * (small ? 0.1 : 0.12),
      scale: small ? 1.12 : 1.3,
    },
    phone: {
      y: window.innerHeight * 0.55,
      rotateX: 72,
      scale: 0.74,
      opacity: 0,
    },
  };
};

function screenFor(s: Step, dark: boolean, payProgress: MotionValue<number>) {
  switch (s.screen) {
    case "unlocked":
      return <AppShot name="unlocked" />;
    case "pay":
      return <ScrollPayScreen progress={payProgress} />;
    case "repay":
      return <AppShot name="repay" />;
    case "home":
      return <AppShot name="home" />;
  }
}

/**
 * iOS-style push: the new screen slides in from the right over the old one, which drifts left and dims.
 * Driven by a critically damped spring (fast start, no overshoot) so a scroll flick feels snappy and a slow
 * scroll still glides; the dim is a separate opacity tween so it never lags the slide.
 */
const push = {
  enter: (d: number) => ({
    x: d > 0 ? "100%" : "-30%",
    opacity: d > 0 ? 1 : 0.55,
    zIndex: d > 0 ? 2 : 0,
  }),
  center: { x: "0%", opacity: 1, zIndex: 1 },
  exit: (d: number) => ({
    x: d > 0 ? "-30%" : "100%",
    opacity: d > 0 ? 0.55 : 1,
    zIndex: d > 0 ? 0 : 2,
  }),
};
const pushTransition = {
  x: { type: "spring", stiffness: 430, damping: 44, mass: 0.85, restDelta: 0.0005, restSpeed: 0.01 },
  opacity: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  zIndex: { duration: 0 },
} as const;

/** L1: a faint dot grid behind the phone on the dark stages. */
function GhostFragments({ on }: { on: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 transition-opacity duration-700",
        on ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(190,180,255,.35)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(60%_55%_at_50%_60%,#000,transparent)]" />
    </div>
  );
}

/**
 * F3–F6 hero. It opens on a yellow splash ("Kredo.") whose full stop swells into a white wipe, then the
 * white headline rises and the phone pops out. The section is several screens tall; its inner stage is sticky (the "pin"), and scroll progress
 * (ScrollTrigger over Lenis) picks the stage, the phone screen and how many feed cards are lit. The segmented
 * control scrolls to a stage. From "Repay and grow" on, the background shifts to deep indigo and the nav inverts.
 * Under reduced motion there is no pin: the control simply switches stages in place.
 */
export function HeroScene() {
  const t = COPY.landing;
  const reduce = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ step: 0, dir: 1 });
  const titleRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  // how far through the pay stage the scroll is (0 to 1); the phone's slider and the paid pop read it directly
  const payProgress = useMotionValue(0);
  const stage = STEPS[state.step].stage;
  const dark = stage >= DARK_FROM;
  const panelId = "hero-stage-panel";

  // every screen the story shows is fetched and decoded up front (not when it first slides in), so scrolling never stalls on an image
  useEffect(() => {
    preloadAppShots(["unlocked", "pay", "paid", "repay", "home"]);
  }, []);

  const apply = useCallback((raw: number) => {
    // during the intro nothing is lit yet; the stages share the rest of the scroll
    if (raw < OPEN) {
      payProgress.set(0);
      setState((prev) =>
        prev.step === 0 && prev.dir === -1 ? prev : { step: 0, dir: -1 },
      );
      return;
    }
    const p = (raw - OPEN) / (1 - OPEN);
    const sg = Math.min(STAGE_COUNT - 1, Math.floor(p * STAGE_COUNT));
    const local = Math.min(1, p * STAGE_COUNT - sg);
    const ids = stepsOf(sg);
    const step = ids[Math.min(ids.length - 1, Math.floor(local * ids.length))];
    payProgress.set(sg < 1 ? 0 : sg > 1 ? 1 : local);
    setState((prev) =>
      prev.step === step
        ? prev
        : { step, dir: step >= prev.step ? 1 : -1 },
    );
  }, [payProgress]);

  // the pin: map scroll progress through the tall section to steps
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el || reduce) return;
    registerGsap();
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => apply(self.progress),
    });
    apply(st.progress);

    // the intro: the headline settles to the top while the phone swings up out of the page toward the viewer
    const from = introFrom();
    const fades = el.querySelectorAll<HTMLElement>("[data-intro-fade]");
    const intro = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: el,
        start: () =>
          `top+=${SPLASH * (el.offsetHeight - window.innerHeight)} top`,
        end: () => `+=${INTRO * (el.offsetHeight - window.innerHeight)}`,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
    intro
      .fromTo(
        titleRef.current,
        { ...from.title, transformOrigin: "50% 0%" },
        { y: 0, scale: 1, ease: "power2.inOut", duration: 1 },
        0,
      )
      // swings up past upright toward the viewer (slight overshoot), then settles: the "pop out"
      .fromTo(
        phoneRef.current,
        { ...from.phone, transformOrigin: "50% 100%" },
        {
          y: () => -window.innerHeight * 0.02,
          rotateX: -7,
          scale: 1.05,
          opacity: 1,
          ease: "power2.out",
          duration: 0.75,
        },
        0,
      )
      .to(
        phoneRef.current,
        { y: 0, rotateX: 0, scale: 1, ease: "power1.inOut", duration: 0.25 },
        0.75,
      )
      .fromTo(fades, { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0.65);
    // the splash: scrolling plays a payment in the scene, then everything breaks apart and the white full stop
    // swells until it fills the screen; then the white hero headline rises into place underneath
    const splash = el.querySelector<HTMLElement>("[data-splash-overlay]");
    const dot = el.querySelector<HTMLElement>("[data-splash-dot]");
    const heroWords = el.querySelectorAll<HTMLElement>("[data-hw]");
    const heroRest = el.querySelectorAll<HTMLElement>("[data-hrest]");
    let wipe: gsap.core.Timeline | undefined;
    if (splash && dot) {
      // scale at which the dot covers the whole frame from wherever it sits
      const cover = () => {
        const f = splash.getBoundingClientRect();
        const d = dot.getBoundingClientRect();
        const cx = d.left + d.width / 2 - f.left;
        const cy = d.top + d.height / 2 - f.top;
        const far = Math.max(
          Math.hypot(cx, cy),
          Math.hypot(f.width - cx, cy),
          Math.hypot(cx, f.height - cy),
          Math.hypot(f.width - cx, f.height - cy),
        );
        return (far * 2.1) / Math.max(1, d.width);
      };
      gsap.set(heroWords, {
        opacity: 0,
        yPercent: 60,
        rotateX: -50,
        filter: "blur(14px)",
      });
      gsap.set(heroRest, { opacity: 0, y: 24, filter: "blur(8px)" });
      wipe = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${SPLASH * (el.offsetHeight - window.innerHeight)}`,
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });
      // 1. the payment (0 to 0.3): the phone turns to the stand, a scan line sweeps the QR, the sheet flips to
      //    "Paid" and a check bursts over it
      const sc = (k: string) => splash.querySelector<HTMLElement>(`[data-sc-${k}]`);
      const [scPhone, scCard, scScan, scPaid, scBurst] = ["phone", "card", "scan", "paid-screen", "burst"].map(sc);
      if (scPhone)
        wipe.to(
          scPhone,
          { xPercent: -14, yPercent: 3, rotationY: 16, rotationX: -4, transformPerspective: 1600, scale: 1.05, ease: "power2.inOut", duration: 0.16 },
          0,
        );
      if (scCard) wipe.to(scCard, { yPercent: 10, xPercent: -6, rotation: -4, ease: "power2.inOut", duration: 0.2 }, 0.02);
      if (scScan)
        wipe
          .to(scScan, { opacity: 1, duration: 0.02 }, 0.06)
          .fromTo(scScan, { top: "6%" }, { top: "88%", ease: "power1.inOut", duration: 0.1 }, 0.06)
          .to(scScan, { opacity: 0, duration: 0.02 }, 0.16);
      if (scPaid) wipe.to(scPaid, { opacity: 1, duration: 0.04 }, 0.17);
      if (scBurst)
        wipe.to(scBurst, { opacity: 1, duration: 0.01 }, 0.19);
      // two rings ripple out from the check, one after the other
      splash.querySelectorAll<HTMLElement>("[data-sc-ring]").forEach((ring, i) =>
        wipe!.fromTo(ring, { scale: 0.6, opacity: 0.9 }, { scale: 2.8, opacity: 0, ease: "power2.out", duration: 0.12 }, 0.19 + i * 0.04),
      );

      // 2. the break-up (0.3 to 0.62): copy lifts away, the scene's objects fly outward, the wordmark blurs out
      splash.querySelectorAll<HTMLElement>("[data-floater]").forEach((f) => {
        const fx = parseFloat(f.dataset.fx ?? "0");
        const fy = parseFloat(f.dataset.fy ?? "0");
        wipe!.to(
          f,
          {
            x: () => fx * window.innerWidth,
            y: () => fy * window.innerHeight,
            scale: 1.25,
            rotate: fx * 30,
            opacity: 0,
            filter: "blur(12px)",
            ease: "power2.in",
            duration: 0.3,
          },
          0.34,
        );
      });
      if (scBurst) wipe.to(scBurst, { opacity: 0, scale: 1.4, filter: "blur(8px)", ease: "power2.in", duration: 0.12 }, 0.34);
      wipe
        .to(
          splash.querySelectorAll("[data-splash-fade]"),
          {
            opacity: 0,
            y: -30,
            filter: "blur(10px)",
            duration: 0.18,
            stagger: 0.03,
          },
          0.3,
        )
        .to(
          splash.querySelectorAll("[data-splash-word]"),
          {
            opacity: 0,
            scale: 1.12,
            filter: "blur(16px)",
            duration: 0.22,
            stagger: 0.04,
          },
          0.4,
        )
        .to(
          splash.querySelector("[data-splash-bg]"),
          { scale: 1.2, opacity: 0.4, duration: 0.4 },
          0.36,
        )
        // 3. the wipe (0.42 to 0.84): the full stop swells until the screen is white
        .fromTo(
          dot,
          { scale: 1 },
          { scale: cover, ease: "power3.in", duration: 0.42 },
          0.42,
        )
        .to(splash, { autoAlpha: 0, duration: 0.08 }, 0.84)
        .to(
          heroWords,
          {
            opacity: 1,
            yPercent: 0,
            rotateX: 0,
            filter: "blur(0px)",
            ease: "power3.out",
            duration: 0.14,
            stagger: 0.025,
          },
          0.84,
        )
        .to(
          heroRest,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            ease: "power2.out",
            duration: 0.12,
            stagger: 0.03,
          },
          0.9,
        );
    }
    const introNodes = [titleRef.current, phoneRef.current, ...fades].filter(
      (n): n is HTMLElement => !!n,
    );
    introNodes.forEach((n) => n.setAttribute("data-intro-ready", ""));

    return () => {
      st.kill();
      intro.scrollTrigger?.kill();
      intro.kill();
      wipe?.scrollTrigger?.kill();
      wipe?.kill();
      [...introNodes, ...heroWords, ...heroRest].forEach((n) =>
        gsap.set(n, { clearProps: "all" }),
      );
      if (splash)
        gsap.set(
          [
            splash,
            ...splash.querySelectorAll<HTMLElement>(
              "[data-floater],[data-splash-fade],[data-splash-word],[data-splash-bg],[data-splash-dot],[data-sc-phone],[data-sc-card],[data-sc-scan],[data-sc-paid-screen],[data-sc-burst],[data-sc-ring]",
            ),
          ],
          { clearProps: "all" },
        );
    };
  }, [reduce, apply]);

  // size the hand-phone to the space left under the headline (CSS var, no re-render)
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      // the floating stage control overlaps the hand, never the screen: the screen's bottom edge sits at 0.834 of
      // the art width below the area top (the box is pulled up by 9% of its width and the glass ends at 92.4%), so
      // leave room for the control (its offset + height + a gap) under it
      const reserve = width < 640 ? 78 : 90;
      const pw = Math.max(
        220,
        Math.min((height - reserve) / 0.834, width * 1.3, width >= 1024 ? 760 : 620),
      );
      el.style.setProperty("--pw", `${Math.round(pw)}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const select = (i: number) => {
    const el = sectionRef.current;
    if (reduce || !el) {
      const ids = stepsOf(i);
      payProgress.set(i < 1 ? 0 : 1);
      setState((prev) => ({
        step: ids[ids.length - 1],
        dir: ids[0] >= prev.step ? 1 : -1,
      }));
      return;
    }
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    scrollToY(
      top +
        (OPEN + ((i === 0 ? 0 : i + 0.02) / STAGE_COUNT) * (1 - OPEN)) * span,
    );
  };

  // pointer tilt (fine pointers only)
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 18 });
  const sry = useSpring(ry, { stiffness: 120, damping: 18 });
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    // floaters read these for their parallax (CSS variables, no re-render)
    e.currentTarget.style.setProperty(
      "--px",
      ((e.clientX - r.left) / r.width - 0.5).toFixed(3),
    );
    e.currentTarget.style.setProperty(
      "--py",
      ((e.clientY - r.top) / r.height - 0.5).toFixed(3),
    );
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 7);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 5);
  };
  const onPointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--px", "0");
    e.currentTarget.style.setProperty("--py", "0");
    rx.set(0);
    ry.set(0);
  };

  const cur = STEPS[state.step];
  // the feed lights a new card on most scroll updates; keep the phone screen out of those re-renders so a slide
  // in progress never has to share a frame with React work
  const screen = useMemo(() => screenFor(cur, dark, payProgress), [cur, dark, payProgress]);

  return (
    <>
      {/* reduced motion: the splash is a plain screen above the hero instead of a pinned overlay */}
      {reduce && (
        <div className="theme-light">
          <HeroSplash />
        </div>
      )}
      <section
        ref={sectionRef}
        id="how"
        aria-label={t.hero.title}
        // painted too, so no strip of another colour can show around the pinned stage while mobile toolbars resize
        // theme-light: the opening stages (splash, Verify, At campus) stay light in either site theme
        className={cn(
          "theme-light relative transition-colors duration-700",
          !reduce && "h-[720svh]",
          stage >= NIGHT ? "bg-[#06060a]" : dark ? "bg-[#120a3f]" : "bg-page",
        )}
      >
        <div
          data-nav-theme={dark ? "dark" : "light"}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className={cn(
            "overflow-hidden",
            reduce
              ? "relative min-h-[calc(100svh-var(--bar-h))]"
              : "sticky top-[var(--bar-h)] h-[calc(100lvh-var(--bar-h))]",
            dark ? "text-white" : "text-ink",
          )}
        >
          {/* L0: page, shifting to indigo */}
          <div aria-hidden className="absolute inset-0 bg-page" />
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              dark ? "opacity-100" : "opacity-0",
            )}
            style={{
              background:
                "radial-gradient(70% 60% at 50% 75%, #3a1fb8 0%, rgba(58,31,184,0) 70%), linear-gradient(180deg,#07051a 0%,#120a3f 60%,#1d0f63 100%)",
            }}
          />
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              stage >= NIGHT ? "opacity-100" : "opacity-0",
            )}
            style={{
              background:
                "radial-gradient(55% 40% at 50% 55%, rgba(58,31,184,.3) 0%, rgba(58,31,184,0) 70%), #06060a",
            }}
          />
          {/* L0b: a purple glow behind the phone and the workflow in huge outlined words, on the dark stages */}
          <div
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ease-out", dark ? "opacity-100" : "opacity-0")}
          >
            {/* a layered aurora: overlapping soft gradients (violet core, indigo and magenta flanks, a floor bounce), masked to fade out and drifting slowly on the GPU. Gradients only, no blur filter, so it stays cheap */}
            <div
              className="absolute left-1/2 top-[56%] aspect-[1.25] w-[min(1500px,190vw)] -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[aurora-a_18s_ease-in-out_infinite_alternate]"
              style={{
                background:
                  "radial-gradient(34% 36% at 50% 44%, rgba(168,140,255,.50), rgba(168,140,255,0) 70%), radial-gradient(40% 40% at 28% 56%, rgba(78,52,225,.46), rgba(78,52,225,0) 72%), radial-gradient(38% 36% at 74% 50%, rgba(196,84,214,.26), rgba(196,84,214,0) 72%), radial-gradient(60% 46% at 50% 74%, rgba(58,31,184,.52), rgba(58,31,184,0) 76%)",
                maskImage: "radial-gradient(closest-side, #000 62%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(closest-side, #000 62%, transparent 100%)",
              }}
            />
            <div
              className="absolute left-1/2 top-[50%] aspect-square w-[min(760px,110vw)] -translate-x-1/2 -translate-y-1/2 mix-blend-screen motion-safe:animate-[aurora-b_13s_ease-in-out_infinite_alternate]"
              style={{
                background:
                  "radial-gradient(40% 46% at 46% 42%, rgba(120,96,255,.38), rgba(120,96,255,0) 70%), radial-gradient(30% 34% at 60% 62%, rgba(236,120,190,.20), rgba(236,120,190,0) 70%)",
                maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
              }}
            />
            {[["top-[16%]", ""], ["bottom-[6%]", "[animation-direction:reverse]"]].map(([pos, dir]) => (
              <div key={pos} className={cn("absolute inset-x-0 overflow-hidden", pos)}>
                {/* data-skew: the row shears with the scroll speed (depth-fx.tsx) */}
                <div data-skew>
                  <div className={cn("flex w-max whitespace-nowrap text-[clamp(90px,13vw,200px)] font-black leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.10)] motion-safe:animate-[passport-ticker_70s_linear_infinite]", dir)}>
                    {[...HERO_WORDS, ...HERO_WORDS].map((w, i) => (
                      <span key={i} className="px-[0.5em]">{w}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <GhostFragments on={dark} />
          {!reduce && <HeroSplash overlay onHow={() => select(0)} />}

          <div
            className={cn(
              "relative flex flex-col items-center pt-[80px] sm:pt-[88px]",
              reduce ? "h-full" : "h-[calc(100svh-var(--bar-h))]",
            )}
          >
            {/* L6 copy: every stage's text shares one grid cell so the phone never jumps */}
            <div
              id={panelId}
              role="tabpanel"
              className="grid w-full max-w-6xl px-4 text-center"
            >
              {t.stages.map((s, i) => {
                const on = i === stage;
                return (
                  <div
                    key={s.id}
                    ref={i === 0 ? titleRef : undefined}
                    data-intro-title={i === 0 ? "" : undefined}
                    aria-hidden={!on}
                    className={cn(
                      "col-start-1 row-start-1 flex flex-col items-center transition-[opacity,transform,visibility] duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
                      on
                        ? "visible translate-y-0 opacity-100"
                        : "invisible translate-y-3 opacity-0",
                    )}
                  >
                    {i === 0 ? (
                      <>
                        <h1 className="text-balance text-[clamp(2.4rem,5.8vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] [perspective:800px]">
                          {t.hero.title.split(" ").map((w, j, all) => (
                            <span key={j}>
                              <span
                                data-hw
                                className="inline-block origin-bottom"
                              >
                                {w}
                              </span>
                              {j < all.length - 1 ? " " : ""}
                            </span>
                          ))}
                        </h1>
                        <p
                          data-hrest
                          className={cn(
                            "mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed sm:text-[17px]",
                            dark ? "text-white/70" : "text-ink-2",
                          )}
                        >
                          {t.hero.sub}
                        </p>
                        <ul
                          data-hrest
                          className="mt-3.5 flex flex-wrap justify-center gap-x-6 gap-y-2"
                        >
                          {t.hero.badges.map((b, j) => {
                            const Icon = j === 0 ? ShieldCheck : Landmark;
                            return (
                              <li
                                key={b.title}
                                className="flex items-center gap-2 text-left"
                              >
                                <Icon className="size-5 shrink-0" aria-hidden />
                                <span className="leading-tight">
                                  <span className="block text-[13px] font-semibold">
                                    {b.title}
                                  </span>
                                  <span
                                    className={cn(
                                      "block text-[11.5px]",
                                      dark ? "text-white/60" : "text-ink-2",
                                    )}
                                  >
                                    {b.sub}
                                  </span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    ) : (
                      <>
                        <h2 className="text-balance text-[clamp(2.2rem,5.8vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
                          {s.title}
                        </h2>
                        {s.id === "access" ? (
                          <EmailPill dark className="mt-5 w-full max-w-md" />
                        ) : (
                          <p
                            className={cn(
                              "mt-3 max-w-xl text-pretty text-[15px] leading-relaxed sm:text-[17px]",
                              i >= DARK_FROM ? "text-white/70" : "text-ink-2",
                            )}
                          >
                            {s.body}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* phone area: hand + phone (L3–L5) */}
            <div
              ref={areaRef}
              className="relative mt-3 w-full flex-1 [--pw:min(560px,calc(100svh-300px))] sm:mt-4 lg:mt-6"
            >
              <div
                className="absolute left-1/2 top-[calc(var(--pw)*-0.09)] -translate-x-1/2 [perspective:1400px]"
                style={{ width: "var(--pw)" }}
              >
                <div
                  ref={phoneRef}
                  data-intro-phone
                  className="[transform-style:preserve-3d]"
                >
                  <motion.div style={{ rotateX: srx, rotateY: sry }}>
                    <HandPhone dark={dark}>
                      <div
                        role="img"
                        aria-label={`${t.hero.phoneAlt}: ${t.stages[stage].label}`}
                        className="size-full"
                      >
                        <ScaledScreen fill bg={dark ? "#0A0620" : "#fff"}>
                          <div className="relative size-full" aria-hidden>
                            <AnimatePresence initial={false} custom={state.dir}>
                              <motion.div
                                key={cur.screen}
                                custom={state.dir}
                                variants={push}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={reduce ? { duration: 0 } : pushTransition}
                                // the soft edge shadow gives the incoming screen depth over the one it covers; at rest it
                                // falls outside the glass, so it only shows while a screen is sliding
                                className="absolute inset-0 shadow-[-18px_0_36px_-14px_rgba(0,0,0,0.28)] [backface-visibility:hidden] [transform:translateZ(0)]"
                                style={{ willChange: "transform, opacity" }}
                              >
                                {screen}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </ScaledScreen>
                      </div>
                    </HandPhone>
                  </motion.div>
                </div>
              </div>
            </div>

            <div
              data-intro-fade
              className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-3 sm:bottom-6"
            >
              <StageSegmented
                stages={t.stages}
                active={stage}
                onSelect={select}
                panelId={panelId}
              />
            </div>
          </div>
          {/* the hand dissolves into the page instead of ending on a hard edge where the next section starts */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t to-transparent transition-colors duration-700 sm:h-36",
              stage >= NIGHT
                ? "from-[#06060a]"
                : dark
                  ? "from-[#1d0f63]"
                  : "from-page",
            )}
          />
        </div>
      </section>
    </>
  );
}
