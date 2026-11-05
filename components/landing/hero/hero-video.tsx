"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { cn } from "@/lib/utils";
import { EmailPill } from "../sections/email-pill";

/** The film (public/hero/kredo-hero.mp4) is 12 s: a hand holds the phone on a campus desk and the app plays through. Swap the file to change it. */
const SRC = "/hero/kredo-hero.mp4";
const POSTER = "/hero/kredo-hero-poster.jpg";

/**
 * Opening frame of the landing page: a full-bleed film that fades in from the page colour, plays once and holds its last frame, with the headline, the
 * early-access field and a scroll cue over it. Text sits on a fade from the page colour, so it reads in both themes.
 * Reduced motion shows the poster (the last frame) with no video. If autoplay is blocked the page colour stays and the cue appears at once.
 */
export function HeroVideo() {
  const t = COPY.landing.hero;
  const reduce = usePrefersReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    // the file can load before React hydrates, so check the current state as well as listening for the events
    const show = () => setReady(true);
    const done = () => {
      setReady(true);
      setEnded(true);
    };
    if (v.readyState >= 2) show();
    if (v.ended) done();
    v.addEventListener("loadeddata", show);
    v.addEventListener("ended", done);
    v.addEventListener("error", done);
    v.play().catch(done); // autoplay refused (e.g. data saver): keep the page colour and show the cue
    return () => {
      v.removeEventListener("loadeddata", show);
      v.removeEventListener("ended", done);
      v.removeEventListener("error", done);
    };
  }, [reduce]);

  const cue = ended || reduce;
  return (
    <section
      aria-label="Kredo"
      id="top"
      className="relative h-svh min-h-[620px] overflow-hidden bg-page"
    >
      <div className="absolute inset-x-0 bottom-0 h-[52%] lg:inset-0 lg:h-auto">
        {reduce ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={POSTER}
            alt=""
            className="absolute inset-0 size-full object-cover object-[85%_50%] lg:object-center"
          />
        ) : (
          <video
            ref={video}
            src={SRC}
            muted
            playsInline
            autoPlay
            preload="auto"
            aria-hidden
            className={cn(
              "absolute inset-0 size-full object-cover object-[85%_50%] transition-opacity duration-1000 lg:object-center",
              ready ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-page to-transparent lg:hidden" />
      </div>

      {/* readability: on wide screens the page colour fades in from the left; on phones the film sits under the text and fades up into it. A soft band at the top keeps the nav readable over the photo. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden lg:block lg:bg-[linear-gradient(90deg,var(--page)_0%,color-mix(in_oklab,var(--page)_86%,transparent)_30%,color-mix(in_oklab,var(--page)_28%,transparent)_58%,transparent_78%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-page/90 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-page to-transparent"
      />

      <div className="relative mx-auto flex h-full max-w-[1180px] flex-col justify-start px-4 pt-28 sm:px-6 lg:justify-center lg:pt-0">
        <div className="max-w-[34rem]">
          <h1 className="text-balance text-[clamp(2.4rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink motion-safe:[animation:rise_.9s_cubic-bezier(.22,1,.36,1)_.5s_both]">
            {t.title}
          </h1>
          <p className="mt-5 max-w-md text-pretty text-[16px] leading-relaxed text-ink-2 sm:text-[18px] motion-safe:[animation:rise_.9s_cubic-bezier(.22,1,.36,1)_.75s_both]">
            {t.sub}
          </p>
          <div className="motion-safe:[animation:rise_.9s_cubic-bezier(.22,1,.36,1)_1s_both]">
            <EmailPill className="mt-7" />
          </div>
        </div>
      </div>

      {/* appears when the film has finished, like a prompt to carry on */}
      <a
        href="#how-it-works"
        aria-label="Scroll to how it works"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
        }}
        className={cn(
          "absolute bottom-7 left-1/2 grid size-11 -translate-x-1/2 place-items-center rounded-full bg-card/80 text-ink ring-1 ring-hairline backdrop-blur transition-all duration-700 hover:bg-card",
          cue
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <ArrowDown className="size-5 motion-safe:animate-bounce" aria-hidden />
      </a>
    </section>
  );
}
