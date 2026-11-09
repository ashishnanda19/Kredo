import { Clock } from "lucide-react";
import { DuesListScreen, LockScreenReminders, OfferScreen, PayReceiptScreen, PhoneFrame } from "@/components/phone-screens";
import { Reveal } from "@/components/shared/reveal";
import { COPY } from "@/lib/copy";
import { moods, moodsLight } from "@/lib/theme";
import { ScrollWords } from "./scroll-words";

const TALL_SCREENS = {
  navy: <DuesListScreen />,
  sunset: <OfferScreen />,
  ember: <LockScreenReminders />,
  forest: <PayReceiptScreen />,
} as const;

/**
 * F11 + F12: the features block (light on the light theme, dark on the dark theme). A wide card with a glowing gradient border and a frosted callout,
 * then four tall "mood" cards (lead line in white, the rest muted) with a phone rising from the bottom.
 * Below lg the tall cards become a horizontal snap row.
 */
export function DarkFeatures() {
  const t = COPY.landing.dark;
  return (
    <section id="features" aria-labelledby="features-title" className="relative scroll-mt-24 bg-page pb-40 pt-24 text-ink sm:pb-52 sm:pt-32">
      {/* the hero's dark edge fades out downward into the page, below the stage control (nothing overlaps the hero) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-32 bg-gradient-to-b from-[#06060a] to-transparent sm:h-40" />
      <div data-reveal className="relative z-10 mx-auto max-w-[1180px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <ScrollWords id="features-title" text={t.title} className="text-balance text-[clamp(2rem,4.6vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em]" />
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">{t.sub}</p>
        </Reveal>

        {/* F11 feature card: hairline edge, a slow light sheen, and a gently floating phone and callout */}
        <Reveal className="group/feature mt-14 sm:mt-16">
          <div className="relative grid overflow-hidden rounded-[28px] bg-soft ring-1 ring-hairline transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:shadow-[0_30px_80px_-30px_rgba(11,11,12,0.25)] dark:hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] lg:min-h-[460px] lg:grid-cols-[1fr_1.1fr]">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent dark:via-white/40" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-1/3 motion-safe:block">
              <div className="size-full bg-gradient-to-r from-transparent via-ink/[0.04] to-transparent dark:via-white/[0.05] motion-safe:animate-[sweep_9s_ease-in-out_3s_infinite]" />
            </div>
            <div className="relative z-10 p-7 sm:p-12 lg:self-center">
              <h3 className="text-balance text-[clamp(1.6rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em]">{t.glow.title}</h3>
              <p className="mt-3 max-w-md text-pretty text-[16px] leading-relaxed text-ink-2">{t.glow.body}</p>
            </div>
            <div className="relative h-[380px] sm:h-[440px] lg:h-auto">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "radial-gradient(50% 60% at 55% 75%, rgba(245,216,50,.12), transparent 70%), radial-gradient(40% 45% at 80% 20%, rgba(255,255,255,.06), transparent 70%)" }}
              />
              <div className="absolute left-1/2 top-10 w-[230px] -translate-x-1/2 sm:w-[260px] lg:top-14 lg:w-[270px]">
                <div className="transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover/feature:-translate-y-2 motion-safe:animate-[float-y_7s_ease-in-out_infinite]">
                  <PhoneFrame fill screenBg="#EAF1E4">
                    <DuesListScreen />
                  </PhoneFrame>
                </div>
              </div>
              <div className="frost absolute left-1/2 top-[38%] flex -translate-x-[88%] items-center gap-2.5 rounded-full border-hairline bg-white/85 py-2 pl-2 pr-4 text-[14px] font-semibold text-ink shadow-[0_12px_40px_-12px_rgba(11,11,12,0.3)] dark:bg-[rgba(20,20,28,0.6)] sm:-translate-x-[95%] motion-safe:animate-[float-y_5.5s_ease-in-out_-2s_infinite]">
                <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-ink">
                  <Clock className="size-4" aria-hidden />
                </span>
                {t.glow.callout}
              </div>
            </div>
          </div>
        </Reveal>

        {/* F12 tall mood cards */}
        <ul data-stagger className="scrollbar-none -mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {t.tall.map((c, i) => (
            <li key={c.mood} className="w-[78vw] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none">
              <Reveal delay={i * 0.06} data-spotlight className="spotlight glow-ring group relative h-[540px] overflow-hidden rounded-[24px] bg-[image:var(--mood-l)] ring-1 ring-hairline dark:bg-[image:var(--mood-d)]" style={{ ["--mood-l" as string]: moodsLight[c.mood], ["--mood-d" as string]: moods[c.mood] }}>
                <p className="relative z-10 p-6 text-[17px] font-medium leading-snug tracking-[-0.01em]">
                  <span className="text-ink">{c.lead}</span> <span className="text-ink-2">{c.rest}</span>
                </p>
                <div className="absolute inset-x-0 -bottom-[22%] mx-auto w-[74%] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-3">
                  <PhoneFrame fill>{TALL_SCREENS[c.mood]}</PhoneFrame>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
      {/* feathered seam into the light section below, instead of a hard edge */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-page sm:h-52" />
    </section>
  );
}
