import { BadgeCheck, CalendarCheck, Repeat, TrendingUp } from "lucide-react";
import { PassportScreen, PhoneFrame } from "@/components/phone-screens";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { TurnIn } from "./turn-in";
import { TwoTone } from "./two-tone";

/** Milestones earned in the app, not awards. */
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
 * Credit-passport look-back: a plain section (white in light mode, dark in dark mode) with the stats, the milestones and
 * the passport phone. No pinning. The phone turns in 3D as the section crosses the screen (turn-in.tsx), the stat cards
 * lean to the pointer and the ticker behind shears with the scroll speed (depth-fx.tsx).
 */
export function PassportHall() {
  const t = COPY.landing.passport;

  return (
    <section
      aria-labelledby="passport-title"
      className="relative z-[1] bg-page text-ink"
      style={{ backgroundImage: "radial-gradient(55% 45% at 70% 60%, color-mix(in oklab, var(--ink) 5%, transparent), transparent 70%)" }}
    >
      {/* feathered seams hang outside the section, over its light neighbours, so no light band shows while it is pinned */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-28 z-20 h-28 bg-gradient-to-b from-transparent to-page sm:-top-36 sm:h-36" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-24 z-20 h-24 bg-gradient-to-b from-page to-transparent" />
      <div className="relative overflow-hidden py-24 sm:py-32">
        {/* a giant outlined ticker drifting behind everything */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[4%] overflow-hidden">
          <div data-skew>
            <div className="flex w-max whitespace-nowrap text-[clamp(110px,15vw,230px)] font-black leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_color-mix(in_oklab,var(--ink)_7%,transparent)] motion-safe:animate-[passport-ticker_60s_linear_infinite]">
              {[...t.ticker, ...t.ticker].map((w, i) => (
                <span key={i} className="px-[0.5em]">{w}</span>
              ))}
            </div>
          </div>
        </div>
        <div aria-hidden className="absolute inset-0 opacity-40 [background-image:radial-gradient(color-mix(in_oklab,var(--ink)_22%,transparent)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(70%_60%_at_50%_50%,#000,transparent)]" />
        <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-ink/[.06] px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink ring-1 ring-ink/10">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" /> {t.eyebrow}
              </p>
              <TwoTone id="passport-title" a={t.titleA} b={t.titleB} />
            </div>
            <dl className="mt-10 grid gap-3 sm:grid-cols-3">
              {STATS.map(([v, k], i) => (
                <div
                  key={k}
                  data-tilt
                  className={cn(
                    "flex flex-col-reverse rounded-[18px] p-5",
                    i === 0 ? "bg-accent text-accent-ink" : "bg-ink/[.05] ring-1 ring-ink/10",
                  )}
                >
                  <dt className={cn("mt-2 text-[13px] font-medium", i === 0 ? "text-accent-ink/70" : "text-ink/60")}>{k}</dt>
                  <dd className="text-[clamp(26px,2.8vw,34px)] font-semibold leading-none tracking-[-0.04em]">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {STAMPS.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 rounded-full border border-ink/15 bg-ink/[.03] py-1.5 pl-1.5 pr-4">
                  <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-ink">
                    <s.icon className="size-4" aria-hidden />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[13px] font-semibold">{s.label}</span>
                    <span className="block text-[11px] text-ink/55">{s.when}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-lg text-[12.5px] leading-relaxed text-ink/60">{t.disclaimer}</p>
          </div>
          <TurnIn className="relative z-10 mx-auto w-[min(300px,78vw)]">
            <PhoneFrame fill screenBg="#0b0b0c">
              <PassportScreen />
            </PhoneFrame>
          </TurnIn>
        </div>
      </div>
    </section>
  );
}
