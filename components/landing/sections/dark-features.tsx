import { Clock } from "lucide-react";
import { DuesListScreen, LockScreenReminders, OfferScreen, PayReceiptScreen, PhoneFrame } from "@/components/phone-screens";
import { Reveal } from "@/components/shared/reveal";
import { COPY } from "@/lib/copy";
import { moods } from "@/lib/theme";

const TALL_SCREENS = {
  navy: <DuesListScreen />,
  sunset: <OfferScreen />,
  ember: <LockScreenReminders wallpaper={moods.ember} />,
  forest: <PayReceiptScreen />,
} as const;

/**
 * F11 + F12: the dark features block. A wide card with a glowing gradient border and a frosted callout,
 * then four tall "mood" cards (lead line in white, the rest muted) with a phone rising from the bottom.
 * Below lg the tall cards become a horizontal snap row.
 */
export function DarkFeatures() {
  const t = COPY.landing.dark;
  return (
    <section id="features" data-nav-theme="dark" aria-labelledby="features-title" className="scroll-mt-24 bg-[#06060a] py-24 text-white sm:py-32">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 id="features-title" className="text-balance text-[clamp(2rem,4.6vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
            {t.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[16px] leading-relaxed text-white/60 sm:text-[17px]">{t.sub}</p>
        </Reveal>

        {/* F11 glow-border card */}
        <Reveal className="mt-14 rounded-[28px] p-[1.5px] sm:mt-16" style={{ background: moods.glowBorder }}>
          <div className="relative grid overflow-hidden rounded-[26.5px] bg-[#0b0b10] lg:min-h-[460px] lg:grid-cols-[1fr_1.1fr]">
            <div className="relative z-10 p-7 sm:p-12 lg:self-center">
              <h3 className="text-balance text-[clamp(1.6rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em]">{t.glow.title}</h3>
              <p className="mt-3 max-w-md text-pretty text-[16px] leading-relaxed text-white/60">{t.glow.body}</p>
            </div>
            <div className="relative h-[380px] sm:h-[440px] lg:h-auto">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "radial-gradient(45% 55% at 55% 70%, rgba(124,92,255,.38), transparent 70%), radial-gradient(35% 40% at 75% 90%, rgba(255,138,61,.22), transparent 70%)" }}
              />
              <div className="absolute left-1/2 top-10 w-[230px] -translate-x-1/2 sm:w-[260px] lg:top-14 lg:w-[270px]">
                <PhoneFrame screenBg="#EAF1E4">
                  <DuesListScreen />
                </PhoneFrame>
              </div>
              <div className="frost absolute left-1/2 top-[38%] flex -translate-x-[88%] items-center gap-2.5 rounded-full border-white/15 bg-[rgba(20,20,28,0.6)] py-2 pl-2 pr-4 text-[14px] font-semibold shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] sm:-translate-x-[95%]">
                <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-ink">
                  <Clock className="size-4" aria-hidden />
                </span>
                {t.glow.callout}
              </div>
            </div>
          </div>
        </Reveal>

        {/* F12 tall mood cards */}
        <ul className="scrollbar-none -mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {t.tall.map((c, i) => (
            <li key={c.mood} className="w-[78vw] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none">
              <Reveal delay={i * 0.06} className="group relative h-[540px] overflow-hidden rounded-[24px] ring-1 ring-white/[.06]" style={{ background: moods[c.mood] }}>
                <p className="relative z-10 p-6 text-[17px] font-medium leading-snug tracking-[-0.01em]">
                  <span className="text-white">{c.lead}</span> <span className="text-white/60">{c.rest}</span>
                </p>
                <div className="absolute inset-x-0 -bottom-[22%] mx-auto w-[74%] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-3">
                  <PhoneFrame>{TALL_SCREENS[c.mood]}</PhoneFrame>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
