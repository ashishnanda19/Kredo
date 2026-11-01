import { ArrowDown, ArrowRight } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

/**
 * The opening splash: a full-bleed signal-yellow screen with the wordmark ("Kredo."), one line and the CTAs.
 * Inside the pinned hero (`overlay`) it covers the stage until the scroll wipe: the wordmark's full
 * stop is a white dot that swells to fill the screen (driven from hero-scene.tsx via the data-splash-* hooks).
 * Under reduced motion it is a plain block above the hero. Text is ink on yellow (well above AA). No patterns:
 * depth comes from light and grain.
 */
export function HeroSplash({
  overlay,
  onHow,
}: {
  overlay?: boolean;
  onHow?: () => void;
}) {
  const t = COPY.landing.splash;
  const letters = t.title.split("");
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
      {/* depth: a warm centre light, a deeper floor, fine grain */}
      <div
        aria-hidden
        data-splash-bg
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(65%_55%_at_50%_44%,#FCE668_0%,rgba(252,230,104,0)_70%),linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_30%,rgba(196,156,0,0.16)_100%)]" />
        <div className="grain absolute inset-0 opacity-[0.08]" />
      </div>

      <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center px-4 pb-16 pt-[calc(var(--bar-h)+56px)] text-center">
        <p className="text-[clamp(5.5rem,19vw,17rem)] font-semibold leading-[0.84] tracking-[-0.065em] max-sm:text-[27vw]">
          <span className="sr-only">{t.title}.</span>
          {letters.map((ch, i) => (
            // each letter rises out of its own mask (clip-path keeps the text baseline, so the dot sits on it);
            // the wipe scales and blurs these wrappers away
            <span
              key={i}
              data-splash-word
              aria-hidden
              className="inline-block [clip-path:inset(-0.3em_-0.2em_0_-0.2em)]"
            >
              <span
                className="splash-letter"
                style={{ animationDelay: `${120 + i * 70}ms` }}
              >
                {ch}
              </span>
            </span>
          ))}
          {/* the full stop: a white dot that becomes the wipe */}
          <span
            data-splash-dot
            aria-hidden
            className="hero-pop relative z-30 ml-[0.035em] inline-block size-[0.15em] rounded-full bg-white align-baseline shadow-[0_0.02em_0.05em_rgba(120,90,0,0.25)]"
            style={{ animationDelay: `${120 + letters.length * 70 + 160}ms` }}
          />
        </p>

        <div data-splash-fade className="mt-6">
          <p className="hero-fade max-w-[30rem] text-balance text-[16px] leading-relaxed text-[#0b0b0c]/75 [animation-delay:640ms] sm:text-[19px]">
            {t.sub}
          </p>
        </div>

        <div data-splash-fade className="mt-8">
          <div className="hero-fade flex flex-wrap items-center justify-center gap-x-3 gap-y-1 [animation-delay:780ms]">
            <a
              href="#access"
              className="sweep group/cta relative inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0b0b0c] pl-6 pr-5 text-[15px] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(11,11,12,0.7)] transition-[translate,box-shadow] duration-300 hover:-translate-y-px hover:shadow-[0_16px_32px_-12px_rgba(11,11,12,0.75)] active:translate-y-0 active:scale-[0.98]"
            >
              {t.cta}
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5"
                aria-hidden
              />
            </a>
            {onHow && (
              <button
                type="button"
                onClick={onHow}
                className="group/how inline-flex min-h-12 items-center gap-1.5 rounded-full px-5 text-[15px] font-semibold"
              >
                {/* underline draws in from the left on hover */}
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1.5px] bg-[position:0_100%] bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover/how:bg-[length:100%_1.5px]">
                  {t.how}
                </span>
                <ArrowDown
                  className="size-4 transition-transform duration-300 group-hover/how:translate-y-0.5"
                  aria-hidden
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {overlay && (
        <div
          data-splash-fade
          aria-hidden
          className="absolute inset-x-0 bottom-5 flex justify-center max-sm:hidden"
        >
          <div className="hero-fade flex flex-col items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.28em] [animation-delay:1100ms]">
            {t.scroll}
            <span className="h-9 w-px overflow-hidden bg-[#0b0b0c]/20">
              <span className="block h-1/2 w-full animate-[scroll-cue_1.6s_ease-in-out_infinite] bg-[#0b0b0c]" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
