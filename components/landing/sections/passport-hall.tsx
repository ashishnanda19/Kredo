"use client";

import { useRef } from "react";
import { BadgeCheck, CalendarCheck, Repeat, TrendingUp } from "lucide-react";
import { PassportScreen, PhoneFrame } from "@/components/phone-screens";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { TwoTone } from "./two-tone";
import { PassportCover } from "./passport-cover";
import { useGsapScene } from "./use-gsap-scene";

/** Offset of an element inside an ancestor from layout positions (ignores transforms, so it stays right mid-zoom). */
function offsetIn(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== ancestor) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** Milestone stamps: earned in the app, not awards. */
const STAMPS = [
  { icon: BadgeCheck, label: "Verified", when: "Aug 2026" },
  { icon: CalendarCheck, label: "First repayment", when: "Sep 2026" },
  { icon: Repeat, label: "3 on time in a row", when: "Oct 2026" },
  { icon: TrendingUp, label: "Limit up", when: "Oct 2026" },
];

const STATS: [string, string][] = [
  ["6", "on-time repayments"],
  ["₹4,350", "repaid in total"],
  ["₹5,000", "limit, up from ₹1,000"],
];

/**
 * Flighty-passport look-back. On wide screens the section pins and opens on a passport-booklet cover; as you scroll
 * the stamps scatter and the booklet flies into the phone, which turns to face you while the copy arrives.
 * Phones and reduced motion get the plain stacked layout. Black like the other dark sections; the nav inverts over it.
 */
export function PassportHall() {
  const t = COPY.landing.passport;
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useGsapScene(ref, (root) => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const pin = root.querySelector<HTMLElement>("[data-pin]");
      const phone = root.querySelector<HTMLElement>("[data-zoom-phone]");
      if (!pin || !phone) return;
      const cover = root.querySelector<HTMLElement>("[data-cover]");
      if (!cover) return;
      gsap.set(cover, { display: "flex" });
      const book = cover.querySelector<HTMLElement>("[data-cover-book]");
      // where the booklet has to travel to land on the phone
      const toPhone = () => {
        const o = offsetIn(phone, pin);
        return { x: o.x + phone.offsetWidth / 2 - pin.clientWidth / 2, y: o.y + phone.offsetHeight / 2 - pin.clientHeight / 2 };
      };
      // set every copy block hidden up front (a staggered tween only pre-renders its first target)
      const copy = root.querySelectorAll("[data-zoom-copy]");
      gsap.set(copy, { opacity: 0, y: 40, filter: "blur(10px)" });
      gsap
        .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } })
        // the cover holds for a beat, then the booklet flies into the phone, turning as it goes
        .to(book, { x: () => toPhone().x, y: () => toPhone().y, scale: 0.42, rotateY: -28, ease: "power2.inOut", duration: 0.4 }, 0.16)
        .to(book, { opacity: 0, filter: "blur(8px)", duration: 0.12 }, 0.46)
        .fromTo(phone, { opacity: 0, scale: 0.86, rotateY: 22 }, { opacity: 1, scale: 1, rotateY: 0, ease: "power2.out", duration: 0.24 }, 0.42)
        .to(copy, { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.06, duration: 0.2 }, 0.5)
        .set(cover, { display: "none" }, 0.6);
      return () => gsap.set([cover, ...copy], { clearProps: "all" });
    });
  });

  return (
    <section
      ref={ref}
      data-nav-theme="dark"
      aria-labelledby="passport-title"
      className={cn("relative z-[1] text-white", !reduce && "lg:h-[240svh]")}
      style={{ background: "radial-gradient(55% 45% at 70% 60%, rgba(255,255,255,.06), transparent 70%), #06060a" }}
    >
      {/* feathered seams hang outside the section, over its light neighbours, so no light band shows while it is pinned */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-28 z-20 h-28 bg-gradient-to-b from-transparent to-[#06060a] sm:-top-36 sm:h-36" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-24 z-20 h-24 bg-gradient-to-b from-[#06060a] to-transparent" />
      <div
        data-pin
        className={cn("relative overflow-hidden py-24 sm:py-32", !reduce && "lg:sticky lg:top-[var(--bar-h)] lg:flex lg:h-[calc(100svh-var(--bar-h))] lg:items-center lg:py-0")}
      >
        {/* opening frame (wide screens with motion only; shown by the timeline) */}
        <div data-cover className="absolute inset-0 z-30 hidden [perspective:1400px]">
          <PassportCover />
        </div>
        {/* a giant outlined ticker drifting behind everything */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[4%] overflow-hidden">
          <div className="flex w-max whitespace-nowrap text-[clamp(110px,15vw,230px)] font-black leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.06)] motion-safe:animate-[passport-ticker_60s_linear_infinite]">
            {[...t.ticker, ...t.ticker].map((w, i) => (
              <span key={i} className="px-[0.35em]">{w} <span className="align-middle text-[0.28em] text-accent/30 [-webkit-text-stroke:0]">✦</span></span>
            ))}
          </div>
        </div>
        <div aria-hidden className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(70%_60%_at_50%_50%,#000,transparent)]" />
        <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div data-zoom-copy>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.16em] text-accent ring-1 ring-white/15">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" /> {t.eyebrow}
              </p>
              <TwoTone id="passport-title" a={t.titleA} b={t.titleB} dark />
            </div>
            <dl data-zoom-copy className="mt-10 grid gap-3 sm:grid-cols-3">
              {STATS.map(([v, k], i) => (
                <div
                  key={k}
                  className={cn(
                    "flex flex-col-reverse rounded-[18px] p-5",
                    i === 0 ? "bg-accent text-accent-ink" : "bg-white/[.06] ring-1 ring-white/12",
                  )}
                >
                  <dt className={cn("mt-2 text-[13px] font-medium", i === 0 ? "text-accent-ink/70" : "text-white/60")}>{k}</dt>
                  <dd className="text-[clamp(26px,2.8vw,34px)] font-semibold leading-none tracking-[-0.04em]">{v}</dd>
                </div>
              ))}
            </dl>
            <ul data-zoom-copy className="mt-8 flex flex-wrap gap-2.5">
              {STAMPS.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[.04] py-1.5 pl-1.5 pr-4">
                  <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-ink">
                    <s.icon className="size-4" aria-hidden />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[13px] font-semibold">{s.label}</span>
                    <span className="block text-[11px] text-white/55">{s.when}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p data-zoom-copy className="mt-8 max-w-lg text-[12.5px] leading-relaxed text-white/60">{t.disclaimer} Sample data.</p>
          </div>
          <div data-zoom-phone className="relative z-10 mx-auto [transform-style:preserve-3d] w-[min(300px,78vw)] lg:w-[min(300px,calc((100svh-160px)/2.14))]">
            <PhoneFrame screenBg="#0b0b0c">
              <PassportScreen />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
