import { Fragment } from "react";
import { ArrowDown } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { SplashObjects } from "./splash-objects";

/**
 * The opening splash: a full-bleed signal-yellow screen with the slogan and campus objects floating around it.
 * Inside the pinned hero (`overlay`) it covers the white stage until the scroll wipe: the full stop of the slogan
 * is a white dot that swells to fill the screen (driven from hero-scene.tsx via the data-splash-* hooks).
 * Under reduced motion it is a plain block above the hero. Text is ink on yellow (well above AA).
 */
export function HeroSplash({
  overlay,
  onHow,
}: {
  overlay?: boolean;
  onHow?: () => void;
}) {
  const t = COPY.landing.splash;
  return (
    <div
      data-splash
      data-splash-overlay={overlay ? "" : undefined}
      className={cn(
        "isolate overflow-hidden bg-accent text-[#0b0b0c]",
        overlay
          ? "absolute inset-0 z-[25]"
          : "relative min-h-[calc(100svh-var(--bar-h))]",
      )}
    >
      {/* depth: a warm centre glow, faint ink rings and dots */}
      <div
        aria-hidden
        data-splash-bg
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_48%,#FFF1A0_0%,rgba(255,241,160,0)_70%),radial-gradient(90%_80%_at_50%_120%,rgba(201,161,0,0.45),transparent_60%)]" />
        <svg
          viewBox="0 0 1000 1000"
          className="absolute left-1/2 top-1/2 h-[150vmax] w-[150vmax] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
          aria-hidden
        >
          {Array.from({ length: 16 }, (_, i) => (
            <circle
              key={i}
              cx="500"
              cy="500"
              r={60 + i * 30}
              fill="none"
              stroke="#0b0b0c"
              strokeWidth="1.2"
            />
          ))}
        </svg>
        <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#0b0b0c_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(70%_60%_at_50%_50%,transparent_40%,#000)]" />
      </div>

      <SplashObjects />

      <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center px-4 pb-16 pt-[calc(var(--bar-h)+64px)] text-center">
        <div data-splash-fade>
          <p className="hero-fade inline-flex items-center gap-2 rounded-full border border-[#0b0b0c]/15 bg-white/40 px-3.5 py-1.5 text-[12.5px] font-semibold backdrop-blur-sm [animation-delay:60ms] sm:text-[13px]">
            <span className="size-1.5 rounded-full bg-[#0b0b0c]" aria-hidden />
            {t.kicker}
          </p>
        </div>

        <p className="mt-5 text-[clamp(3.1rem,10vw,9.5rem)] font-bold leading-[0.86] tracking-[-0.065em] [perspective:900px]">
          {/* the space sits between the inline-block words, where it cannot collapse */}
          {t.title.split(" ").map((w, i, all) => (
            <Fragment key={i}>
              <span data-splash-word className="inline-block">
                <span className="hero-word" style={{ animationDelay: `${140 + i * 120}ms` }}>
                  {w}
                </span>
              </span>
              {i < all.length - 1 ? " " : ""}
            </Fragment>
          ))}
          {/* the full stop: a white dot that becomes the wipe */}
          <span
            data-splash-dot
            aria-hidden
            className="hero-pop relative z-30 ml-[0.04em] inline-block size-[0.2em] rounded-full bg-white align-baseline shadow-[0_0_0_0.02em_rgba(11,11,12,0.08)] [animation-delay:420ms]"
          />
          <span className="sr-only">.</span>
        </p>

        <div data-splash-fade className="mt-6">
          <p className="hero-fade max-w-[34rem] text-pretty text-[16px] font-medium leading-relaxed text-[#0b0b0c]/75 [animation-delay:520ms] sm:text-[19px]">
            {t.sub}
          </p>
        </div>

        <div data-splash-fade className="mt-8">
          <div className="hero-fade flex flex-wrap items-center justify-center gap-3 [animation-delay:680ms]">
            <a
              href="#access"
              className="inline-flex min-h-12 items-center rounded-full bg-[#0b0b0c] px-6 text-[15px] font-semibold text-white transition-transform active:scale-[0.97]"
            >
              {t.cta}
            </a>
            {onHow && (
              <button
                type="button"
                onClick={onHow}
                className="inline-flex min-h-12 items-center gap-1.5 rounded-full px-5 text-[15px] font-semibold underline decoration-[#0b0b0c]/30 underline-offset-4 hover:decoration-[#0b0b0c]"
              >
                {t.how} <ArrowDown className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>

      {overlay && (
        <div
          data-splash-fade
          aria-hidden
          className="absolute inset-x-0 bottom-5"
        >
          <div className="hero-fade flex flex-col items-center gap-1 text-[11px] font-bold uppercase tracking-[0.25em] [animation-delay:900ms]">
            {t.scroll}
            <span className="h-8 w-px overflow-hidden bg-[#0b0b0c]/20">
              <span className="block h-1/2 w-full animate-[scroll-cue_1.6s_ease-in-out_infinite] bg-[#0b0b0c]" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
