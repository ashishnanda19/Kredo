import { COPY } from "@/lib/copy";
import { TwoTone } from "./two-tone";

/**
 * Voices placeholder marquee. These are NOT testimonials: every card carries a visible "Sample" tag and the
 * section says the quotes are to be replaced with real survey answers.
 */
export function Voices() {
  const t = COPY.landing.voices;
  return (
    <section aria-labelledby="voices-title" className="overflow-hidden bg-soft-seam py-32 sm:py-40">
      <div data-reveal className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <TwoTone id="voices-title" a={t.titleA} b={t.titleB} className="max-w-2xl" />
      </div>
      <ul className="sr-only">
        {t.quotes.map((q) => (
          <li key={q.q}>{`${t.label}: "${q.q}", ${q.who}`}</li>
        ))}
      </ul>
      <div data-reveal aria-hidden className="edge-fade-x group mt-12 overflow-hidden">
        <ul className="flex w-max gap-4 pr-4 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none" style={{ animationDuration: "70s" }}>
          {[...t.quotes, ...t.quotes].map((q, i) => (
            <li key={i} className="flex w-[300px] shrink-0 flex-col justify-between rounded-[16px] bg-elevated p-5 ring-1 ring-hairline sm:w-[340px]">
              <span className="self-start rounded-full bg-warn/15 px-2 py-0.5 font-mono text-[10.5px] font-semibold tracking-wide text-warn-text">{t.tag}</span>
              <p className="mt-4 text-[16px] font-medium leading-snug tracking-[-0.01em] text-ink">&ldquo;{q.q}&rdquo;</p>
              <p className="mt-5 text-[12.5px] text-ink-2">{q.who}</p>
            </li>
          ))}
        </ul>
      </div>
      <p className="mx-auto mt-6 max-w-[1180px] px-4 text-[12px] text-ink-2 sm:px-6">{t.label}.</p>
    </section>
  );
}
