import { Coin } from "@/components/shared/logo";
import { Wordmark } from "@/components/shared/logo";
import { COPY } from "@/lib/copy";

/**
 * Opening frame of the credit-passport section on wide screens: a closed passport booklet, drawn like a real object.
 * Matte ink cover, a stack of pages showing on the open edges, a stitched spine, and foil-stamped details in the brand
 * yellow (the coin as the seal, the title, the chip symbol of an e-passport). It is seen at full size, then shrinks into
 * the phone on scroll: the scroll scene moves `data-cover-book`, and the tilt lives on an inner element.
 */
export function PassportCover() {
  const c = COPY.landing.passport.cover;
  const foil = "text-accent [text-shadow:0_1px_0_rgba(255,255,255,0.22),0_-1px_0_rgba(0,0,0,0.55)]";
  return (
    <div aria-hidden className="relative flex size-full items-center justify-center">
      <div data-cover-book className="relative aspect-[0.71] h-[min(68svh,560px)]">
        <div className="relative size-full [transform:rotate(-2deg)]">
          {/* page block on the right and bottom edges */}
          <div className="absolute inset-0 rounded-[6px_16px_16px_6px] bg-[#ded9cb] shadow-[2px_0_0_#c9c4b4,4px_0_0_#ded9cb,6px_0_0_#b8b3a2,8px_1px_0_#ded9cb,10px_2px_0_#a7a291,0_4px_0_#c9c4b4,0_8px_0_#a7a291,0_70px_90px_-30px_rgba(0,0,0,0.85)]" />
          <div className="relative flex size-full flex-col overflow-hidden rounded-[6px_16px_16px_6px] bg-[#0d0f1a] text-white [container-type:inline-size]">
            {/* soft top light and fine grain, so the cover reads as matte cloth rather than a flat fill */}
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_45%)]" />
            <span aria-hidden className="grain pointer-events-none absolute inset-0 opacity-[0.12]" />
            {/* spine: a crease and a row of stitches */}
            <span aria-hidden className="absolute inset-y-0 left-0 w-[7%] bg-[linear-gradient(90deg,rgba(0,0,0,0.45),rgba(0,0,0,0.1)_70%,transparent)]" />
            <span aria-hidden className="absolute inset-y-[4%] left-[5%] w-px border-l border-dashed border-white/20" />
            {/* debossed frame */}
            <span aria-hidden className="absolute inset-[5%] left-[9%] rounded-[3px] border border-accent/35" />

            <div className="relative flex size-full flex-col items-center px-[15%] py-[11%] pl-[18%]">
              <p className={`text-[2.9cqw] font-semibold uppercase tracking-[0.32em] ${foil}`}>{c.edition}</p>

              {/* the seal: the coin inside two fine rings */}
              <div className="relative mt-[9%] grid aspect-square w-[60%] place-items-center rounded-full border border-accent/55">
                <span aria-hidden className="absolute inset-[7%] rounded-full border border-accent/30" />
                <Coin className="h-[19.5cqw] drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]" />
              </div>

              <h3 className="mt-[8%] text-center text-[12.5cqw] font-semibold leading-[0.95] tracking-[-0.04em] text-white">
                Credit
                <br />
                Passport
              </h3>

              <div className="mt-auto flex w-full flex-col items-center gap-[5%]">
                {/* e-passport chip symbol */}
                <svg viewBox="0 0 40 28" className={`h-[6.5cqw] w-auto ${foil}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <rect x="1" y="1" width="38" height="26" rx="3" />
                  <circle cx="20" cy="14" r="7" />
                </svg>
                <div className="flex w-full items-center justify-between text-white/55">
                  <Wordmark className="h-[4.2cqw] text-white/70" />
                  <span className="font-mono text-[2.6cqw] tracking-[0.2em]">{c.number}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
