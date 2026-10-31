import { BadgeCheck, CalendarCheck, Repeat, TrendingUp } from "lucide-react";
import { PassportScreen, PhoneFrame } from "@/components/phone-screens";
import { Reveal } from "@/components/shared/reveal";
import { COPY } from "@/lib/copy";
import { TwoTone } from "./two-tone";

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

/** Flighty-passport style look-back on how the internal score was built. Dark indigo; the nav inverts over it. */
export function PassportHall() {
  const t = COPY.landing.passport;
  return (
    <section
      data-nav-theme="dark"
      aria-labelledby="passport-title"
      className="relative overflow-hidden py-24 text-white sm:py-32"
      style={{ background: "radial-gradient(60% 50% at 70% 60%, rgba(109,75,255,.35), transparent 70%), linear-gradient(180deg,#07051a 0%,#120a3f 100%)" }}
    >
      <div aria-hidden className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(190,180,255,.35)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(70%_60%_at_50%_50%,#000,transparent)]" />
      <div className="relative mx-auto grid max-w-[1180px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <TwoTone id="passport-title" a={t.titleA} b={t.titleB} dark />
          <dl className="mt-10 grid gap-3 sm:grid-cols-3">
            {STATS.map(([v, k]) => (
              <div key={k} className="flex flex-col-reverse rounded-[16px] bg-white/[.06] p-4 ring-1 ring-white/10">
                <dt className="mt-1.5 text-[13px] text-white/60">{k}</dt>
                <dd className="text-[24px] font-semibold leading-tight tracking-[-0.03em]">{v}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-8 flex flex-wrap gap-3">
            {STAMPS.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 rounded-full border border-dashed border-white/25 py-1.5 pl-1.5 pr-4">
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
          <p className="mt-8 max-w-lg text-[12.5px] leading-relaxed text-white/60">{t.disclaimer} Sample data.</p>
        </div>
        <Reveal className="mx-auto w-[min(300px,78vw)]">
          <PhoneFrame screenBg="#0A0620">
            <PassportScreen />
          </PhoneFrame>
        </Reveal>
      </div>
    </section>
  );
}
