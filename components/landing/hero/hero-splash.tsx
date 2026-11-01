import { ArrowDown, ArrowRight, CalendarCheck, ScanLine, Wallet } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { SplashScene } from "./splash-scene";

const STEP_ICONS = [ScanLine, Wallet, CalendarCheck];

/**
 * The opening splash: a full-bleed signal-yellow stage. Left, the wordmark ("Kredo."), the promise, the CTAs
 * and the product in three steps; right, a 3D still life of paying at a campus stall (splash-scene.tsx), so the
 * product reads before any scroll. Inside the pinned hero (`overlay`) scrolling plays the payment, then the
 * wordmark's full stop swells into the white wipe (driven from hero-scene.tsx via the data-splash-* and
 * data-sc-* hooks). Under reduced motion it is a plain block above the hero and nothing moves.
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
  const dotDelay = 120 + letters.length * 80 + 160;
  const cut = t.sub.indexOf(t.subMark);
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
      {/* light: three drifting pools, a spotlight that trails the pointer, a floor shade, grain */}
      <div
        aria-hidden
        data-splash-bg
        className="pointer-events-none absolute inset-0"
      >
        <div className="mesh-a absolute -left-[22%] -top-[38%] size-[85vmax] rounded-full bg-[radial-gradient(closest-side,rgba(255,250,214,0.9),rgba(255,250,214,0))]" />
        <div className="mesh-b absolute -right-[30%] top-[2%] size-[80vmax] rounded-full bg-[radial-gradient(closest-side,rgba(255,184,28,0.45),rgba(255,184,28,0))]" />
        <div className="mesh-c absolute -bottom-[48%] left-[12%] size-[78vmax] rounded-full bg-[radial-gradient(closest-side,rgba(255,226,64,0.9),rgba(255,226,64,0))]" />
        <div
          className="absolute left-1/2 top-[44%] size-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.35),rgba(255,255,255,0))]"
          style={{
            transform: "translate3d(calc(var(--px, 0) * 70vw), calc(var(--py, 0) * 70vh), 0)",
            transition: "transform 0.9s var(--ease-out)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_55%,rgba(150,108,0,0.2)_100%)]" />
        <div className="grain absolute inset-0 opacity-[0.1]" />
      </div>

      <div className="relative mx-auto grid h-full min-h-[inherit] max-w-[1240px] content-start items-center gap-x-10 px-5 pt-[calc(var(--bar-h)+64px)] sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:content-center lg:pb-10 lg:pt-[calc(var(--bar-h)+40px)]">
        {/* copy */}
        <div className="text-center lg:text-left">
          <p className="text-[clamp(4.6rem,10.2vw,10.25rem)] font-semibold leading-[0.84] tracking-[-0.065em] max-lg:text-[min(24vw,9rem)]">
            <span className="sr-only">{t.title}.</span>
            {letters.map((ch, i) => (
              // each letter rises out of its own mask (clip-path keeps the baseline, so the dot sits on it); the
              // wipe scales and blurs these wrappers away
              <span
                key={i}
                data-splash-word
                aria-hidden
                className="inline-block [clip-path:inset(-0.3em_-0.2em_-0.1em_-0.2em)]"
              >
                <span
                  className="splash-letter"
                  style={{ animationDelay: `${120 + i * 80}ms` }}
                >
                  {ch}
                </span>
              </span>
            ))}
            {/* the full stop: a white dot that becomes the wipe */}
            <span
              data-splash-dot
              aria-hidden
              className="hero-pop relative z-30 ml-[0.03em] inline-block size-[0.15em] rounded-full bg-white align-baseline"
              style={{ animationDelay: `${dotDelay}ms` }}
            />
          </p>

          <div data-splash-fade className="mt-5 sm:mt-7">
            <p className="hero-fade text-[18px] font-medium leading-snug tracking-[-0.015em] text-[#0b0b0c]/80 [animation-delay:700ms] sm:text-[22px]">
              {t.sub.slice(0, cut)}
              <span className="relative inline-block whitespace-nowrap text-[#0b0b0c]">
                {t.subMark}
                {/* hand-drawn underline, inked in after the line lands */}
                <svg
                  aria-hidden
                  viewBox="0 0 120 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-[0.32em] left-[-2%] h-[0.5em] w-[104%] overflow-visible"
                >
                  <path
                    d="M2 8.5C22 4.2 48 3 70 4.6c16 1.1 31 2.6 46 1.2"
                    pathLength={1}
                    fill="none"
                    stroke="#0b0b0c"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    className="ink-draw"
                    style={{ animationDelay: "1400ms" }}
                  />
                </svg>
              </span>
            </p>
          </div>

          <div data-splash-fade className="mt-7 sm:mt-9">
            <div className="hero-fade flex flex-wrap items-center justify-center gap-2.5 [animation-delay:840ms] lg:justify-start">
              <a
                href="#access"
                className="sweep group/cta relative inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0b0b0c] pl-6 pr-5 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_12px_28px_-12px_rgba(11,11,12,0.7)] transition-[translate,box-shadow] duration-300 hover:-translate-y-px hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_32px_-12px_rgba(11,11,12,0.75)] active:translate-y-0 active:scale-[0.98]"
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
                  className="group/how inline-flex min-h-12 items-center gap-1.5 rounded-full bg-white/30 px-5 text-[15px] font-semibold shadow-[inset_0_0_0_1px_rgba(11,11,12,0.1)] backdrop-blur-sm transition-colors duration-300 hover:bg-white/50"
                >
                  {t.how}
                  <ArrowDown
                    className="size-4 transition-transform duration-300 group-hover/how:translate-y-0.5"
                    aria-hidden
                  />
                </button>
              )}
            </div>
          </div>

          {/* the product in three steps, readable without scrolling */}
          <div data-splash-fade className="mt-10 max-lg:hidden">
            <ol className="hero-fade flex items-stretch [animation-delay:1000ms]">
              {t.steps.map((s, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <li
                    key={s.title}
                    className="flex flex-1 items-start gap-3 border-l border-[#0b0b0c]/15 px-4 first:border-l-0 first:pl-0"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#0b0b0c] text-accent">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <span className="text-[13px] leading-snug">
                      <span className="block font-semibold">{s.title}</span>
                      <span className="block text-[#0b0b0c]/65">{s.body}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* the scene; pointer tilt on desktop */}
        <div className="mx-auto mt-8 w-[min(86vw,420px)] lg:mt-0 lg:w-full lg:max-w-[600px]">
          <div
            style={{
              transform: "perspective(1600px) rotateX(calc(var(--py, 0) * -8deg)) rotateY(calc(var(--px, 0) * 10deg))",
              transition: "transform 0.8s var(--ease-out)",
            }}
          >
            <SplashScene />
          </div>
        </div>
      </div>
    </div>
  );
}
