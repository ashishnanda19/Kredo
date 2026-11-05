import { BadgeCheck, CalendarCheck, Repeat, TrendingUp } from "lucide-react";
import { PassportScreen, PhoneFrame } from "@/components/phone-screens";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
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

/** Credit-passport look-back: a plain black section with the stats, the milestones and the passport phone. No pinning, no transition. The nav inverts over it. */
export function PassportHall() {
  const t = COPY.landing.passport;

  return (
    <section
      data-nav-theme="dark"
      aria-labelledby="passport-title"
      className="relative z-[1] text-white"
      style={{ background: "radial-gradient(55% 45% at 70% 60%, rgba(255,255,255,.06), transparent 70%), #06060a" }}
    >
      {/* feathered seams hang outside the section, over its light neighbours, so no light band shows while it is pinned */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-28 z-20 h-28 bg-gradient-to-b from-transparent to-[#06060a] sm:-top-36 sm:h-36" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-24 z-20 h-24 bg-gradient-to-b from-[#06060a] to-transparent" />
      <div className="relative overflow-hidden py-24 sm:py-32">
        {/* a giant outlined ticker drifting behind everything */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[4%] overflow-hidden">
          <div className="flex w-max whitespace-nowrap text-[clamp(110px,15vw,230px)] font-black leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.06)] motion-safe:animate-[passport-ticker_60s_linear_infinite]">
            {[...t.ticker, ...t.ticker].map((w, i) => (
              <span key={i} className="px-[0.5em]">{w}</span>
            ))}
          </div>
        </div>
        <div aria-hidden className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(70%_60%_at_50%_50%,#000,transparent)]" />
        <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.16em] text-accent ring-1 ring-white/15">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" /> {t.eyebrow}
              </p>
              <TwoTone id="passport-title" a={t.titleA} b={t.titleB} dark />
            </div>
            <dl className="mt-10 grid gap-3 sm:grid-cols-3">
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
            <ul className="mt-8 flex flex-wrap gap-2.5">
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
            <p className="mt-8 max-w-lg text-[12.5px] leading-relaxed text-white/60">{t.disclaimer}</p>
          </div>
          <div className="relative z-10 mx-auto w-[min(300px,78vw)]">
            <PhoneFrame screenBg="#0b0b0c">
              <PassportScreen />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
