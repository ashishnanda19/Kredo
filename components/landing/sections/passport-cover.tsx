import { BadgeCheck, CalendarCheck, Repeat, TrendingUp } from "lucide-react";
import { Coin, Wordmark } from "@/components/shared/logo";
import { COPY } from "@/lib/copy";

/** Milestone stamps: earned in the app, not awards. Shown inside the passport and again beside the phone. */
export const STAMPS = [
  { icon: BadgeCheck, label: "Verified", when: "Aug 2026" },
  { icon: CalendarCheck, label: "First repayment", when: "Sep 2026" },
  { icon: Repeat, label: "3 on time in a row", when: "Oct 2026" },
  { icon: TrendingUp, label: "Limit up", when: "Oct 2026" },
];

/**
 * Opening frame of the credit-passport section on wide screens: a passport booklet, drawn like a real object.
 * Brand-yellow matte cover with a slow light sweep, a foil seal ring that turns and stitched edges. On scroll the front cover swings open on its spine to show the holder page and the milestone stamps,
 * then the spread shrinks into the phone. The scroll scene drives `data-cover-front` (the swing), `data-stamp` (each
 * stamp pops in) and `data-cover-book` (the move); the idle float and the tilt live on inner elements.
 */
export function PassportCover() {
  const c = COPY.landing.passport.cover;
  const ink = "text-[#0b0b0c]";
  const foil = `${ink}/85 [text-shadow:0_1px_0_rgba(255,255,255,0.45)]`;
  return (
    <div aria-hidden className="relative flex size-full items-center justify-center">
      <div data-cover-book className="relative aspect-[0.71] h-[min(68svh,560px)]">
        <div className="relative size-full [perspective:1900px] [transform-style:preserve-3d] [transform:rotate(-2deg)]">
         <div className="relative size-full [transform-style:preserve-3d] motion-safe:animate-[float-y_6s_ease-in-out_infinite]">
          {/* page block on the right and bottom edges */}
          <div className="absolute inset-0 rounded-[6px_16px_16px_6px] bg-[#e9e6dc] shadow-[2px_0_0_#c9c4b4,4px_0_0_#ded9cb,6px_0_0_#b8b3a2,8px_1px_0_#ded9cb,10px_2px_0_#a7a291,0_4px_0_#c9c4b4,0_8px_0_#a7a291,0_70px_90px_-30px_rgba(0,0,0,0.85)]" />

          {/* inside right page: the milestone stamps */}
          <div className="absolute inset-0 overflow-hidden rounded-[6px_16px_16px_6px] bg-[#f6f3ea] text-[#0b0b0c] [container-type:inline-size]">
            <span aria-hidden className="absolute inset-y-0 left-0 w-[6%] bg-[linear-gradient(90deg,rgba(0,0,0,0.14),transparent)]" />
            <div className="flex size-full flex-col px-[9%] py-[9%] pl-[12%]">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[2.6cqw] font-semibold uppercase tracking-[0.28em] text-[#0b0b0c]/55">Milestones</p>
                <span className="rounded-full bg-[#0b0b0c] px-[2.6cqw] py-[0.8cqw] font-mono text-[2.4cqw] font-semibold tracking-wide text-accent [transform:rotate(4deg)]">4 / 4 unlocked</span>
              </div>
              <ul className="mt-[6%] flex flex-1 flex-col justify-between">
                {STAMPS.map((s) => (
                  <li key={s.label} data-stamp className="flex items-center gap-[5%] border-b border-dashed border-[#0b0b0c]/20 pb-[5%]">
                    <span className="grid size-[11cqw] shrink-0 place-items-center rounded-full border-2 border-[#0b0b0c] bg-accent text-[#0b0b0c] shadow-[2px_2px_0_#0b0b0c] [transform:rotate(-8deg)]">
                      <s.icon className="size-[5.2cqw]" strokeWidth={2.2} aria-hidden />
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block text-[4.2cqw] font-semibold tracking-[-0.01em]">{s.label}</span>
                      <span className="block font-mono text-[2.8cqw] uppercase tracking-[0.14em] text-[#0b0b0c]/55">{s.when}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-[4%] font-mono text-[2.4cqw] tracking-[0.2em] text-[#0b0b0c]/45">{c.number}</p>
            </div>
          </div>

          {/* front cover: swings open on the spine (left edge). Its back is the holder page. */}
          <div data-cover-front className="absolute inset-0 [transform-origin:left_center] [transform-style:preserve-3d]">
            <div className={`backface-hidden absolute inset-0 flex flex-col overflow-hidden rounded-[6px_16px_16px_6px] bg-accent ${ink} [container-type:inline-size]`}>
              {/* soft top light and fine grain, so the cover reads as matte cloth rather than a flat fill */}
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.42),transparent_45%,rgba(0,0,0,0.06))]" />
              <span aria-hidden className="grain pointer-events-none absolute inset-0 opacity-[0.12]" />
              {/* a slow light sweep, like foil catching the light */}
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 motion-safe:animate-[sweep_5.5s_ease-in-out_1s_infinite]">
                <span className="block size-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              </span>
              {/* spine: a crease and a row of stitches */}
              <span aria-hidden className="absolute inset-y-0 left-0 w-[7%] bg-[linear-gradient(90deg,rgba(0,0,0,0.2),rgba(0,0,0,0.04)_70%,transparent)]" />
              <span aria-hidden className="absolute inset-y-[4%] left-[5%] w-px border-l border-dashed border-[#0b0b0c]/40" />
              {/* debossed frame */}
              <span aria-hidden className="absolute inset-[5%] left-[9%] rounded-[3px] border border-[#0b0b0c]/30" />

              <div className="relative flex size-full flex-col items-center px-[15%] py-[10%] pl-[18%]">
                <p className={`text-[2.9cqw] font-semibold uppercase tracking-[0.32em] ${foil}`}>{c.edition}</p>

                {/* the seal: the coin on a black disc inside a turning foil ring */}
                <div className="relative mt-[8%] grid aspect-square w-[58%] place-items-center">
                  <span aria-hidden className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#0b0b0c,#fff7b8,#0b0b0c,#d9b400,#0b0b0c)] [animation:turn_14s_linear_infinite] motion-reduce:animate-none" />
                  <span aria-hidden className="absolute inset-[5%] rounded-full bg-accent" />
                  <span className="relative grid size-[72%] place-items-center rounded-full bg-[#0b0b0c] shadow-[0_6px_14px_-4px_rgba(0,0,0,0.5)]"><Coin className="h-[17cqw]" /></span>
                </div>

                <h3 className="mt-[7%] text-center text-[12.5cqw] font-semibold leading-[0.95] tracking-[-0.045em] text-[#0b0b0c] [text-shadow:0_1px_0_rgba(255,255,255,0.35)]">
                  Credit
                  <br />
                  Passport
                </h3>

                <div className="mt-auto flex w-full flex-col items-center gap-[4%]">
                  <div className="flex w-full items-center justify-between text-[#0b0b0c]/70">
                    <Wordmark className="h-[4.2cqw] text-[#0b0b0c]" />
                    <span className="font-mono text-[2.6cqw] tracking-[0.2em]">{c.number}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* the back of the cover, seen once it has swung open: the holder page */}
            <div className="backface-hidden absolute inset-0 overflow-hidden rounded-[16px_6px_6px_16px] bg-[#f6f3ea] text-[#0b0b0c] [container-type:inline-size] [transform:rotateY(180deg)]">
              <span aria-hidden className="absolute inset-y-0 right-0 w-[6%] bg-[linear-gradient(270deg,rgba(0,0,0,0.14),transparent)]" />
              <div className="flex size-full flex-col items-center px-[12%] py-[10%] pr-[14%] text-center">
                <p className="font-mono text-[2.6cqw] font-semibold uppercase tracking-[0.28em] text-[#0b0b0c]/55">This passport belongs to</p>
                <span className="relative mt-[8%] grid size-[32cqw] place-items-center rounded-full border-2 border-[#0b0b0c] bg-accent text-[11cqw] font-semibold tracking-[-0.04em] shadow-[3px_3px_0_#0b0b0c]">
                  AS
                </span>
                <p className="mt-[7%] text-[7.4cqw] font-semibold leading-tight tracking-[-0.035em]">Aarav Sharma</p>
                <p className="mt-[2%] text-[3.8cqw] text-[#0b0b0c]/65">Manipal University Jaipur</p>
                <span className="mt-[6%] inline-flex items-center gap-[1.6cqw] rounded-full bg-[#0b0b0c] px-[3.6cqw] py-[1.6cqw] text-[3.4cqw] font-semibold text-accent [transform:rotate(-3deg)]">
                  <span aria-hidden>✦</span> Main Character · Aura 82
                </span>
                <div className="mt-[7%] h-px w-[60%] bg-[#0b0b0c]/20" />
                <p className="mt-[5%] font-mono text-[2.8cqw] uppercase tracking-[0.2em] text-[#0b0b0c]/55">{c.edition}</p>
                <p className="mt-[2%] font-mono text-[2.8cqw] tracking-[0.2em] text-[#0b0b0c]/55">{c.number}</p>
                <p className="mt-auto text-[3cqw] leading-snug text-[#0b0b0c]/50">An internal record of how you repay. Not a bureau score.</p>
              </div>
            </div>
          </div>
         </div>
        </div>
      </div>
    </div>
  );
}
