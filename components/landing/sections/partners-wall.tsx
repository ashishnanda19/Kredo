import { COPY } from "@/lib/copy";
import { Reveal } from "@/components/shared/reveal";

/** Abstract placeholder marks (no real logos): simple geometry, one per tile. */
const MARKS = [
  <circle key="a" cx="20" cy="20" r="11" />,
  <rect key="b" x="9" y="9" width="22" height="22" rx="5" />,
  <path key="c" d="M20 7 33 31H7Z" />,
  <path key="d" d="M9 20a11 11 0 0 1 22 0Z M9 24h22v6H9Z" />,
  <path key="e" d="M8 12h24v5H8Zm0 8h24v5H8Zm0 8h16v5H8Z" />,
  <path key="f" d="M20 7l4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" />,
];

/**
 * F10 partners wall: a grid of dark tiles standing in for college and vendor marks. Every tile is a visibly
 * labelled placeholder; real partners appear only with their permission.
 */
export function PartnersWall() {
  const t = COPY.landing.partners;
  return (
    <section aria-labelledby="partners-title" className="bg-page py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">{t.eyebrow}</p>
          <h2 id="partners-title" className="mt-3 text-balance text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
            {t.title}
          </h2>
        </Reveal>
        <ul className="mt-12 grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <li
              key={i}
              className="group relative flex aspect-[5/4] flex-col items-center justify-center gap-2 rounded-[16px] bg-[#0f0f12] text-white transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 dark:bg-[#15151c]"
            >
              <svg viewBox="0 0 40 40" className="size-9 fill-white/85 sm:size-10" aria-hidden>
                {MARKS[i % MARKS.length]}
              </svg>
              <span className="text-[10.5px] font-medium tracking-wide text-white/55">
                {t.tile} {String(i + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-center text-[12px] text-ink-2">{t.note}</p>
      </div>
    </section>
  );
}
