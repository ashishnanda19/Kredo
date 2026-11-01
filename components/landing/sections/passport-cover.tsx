import { LogoMark } from "@/components/shared/logo";
import { BRAND } from "@/lib/config";

const STAMPS = [
  { t: "VERIFIED", d: "AUG 2026", pos: "left-[8%] top-[18%]", r: -14 },
  { t: "ON TIME", d: "SEP 2026", pos: "right-[9%] top-[24%]", r: 11 },
  { t: "LIMIT UP", d: "OCT 2026", pos: "left-[12%] bottom-[16%]", r: 8 },
  { t: "3 IN A ROW", d: "OCT 2026", pos: "right-[11%] bottom-[20%]", r: -9 },
];

/**
 * Opening frame of the credit-passport section on wide screens: a passport booklet cover (original artwork)
 * with milestone stamps around it. It is designed to be seen at full size, then shrinks into the phone on scroll.
 */
export function PassportCover() {
  return (
    <div aria-hidden className="relative flex size-full items-center justify-center">
      {STAMPS.map((s) => (
        <span
          key={s.t}
          data-cover-stamp
          className={`absolute ${s.pos} grid size-[132px] place-items-center rounded-full border-2 border-dashed border-accent/60 text-center font-mono text-accent/80`}
          style={{ transform: `rotate(${s.r}deg)` }}
        >
          <span className="leading-tight">
            <span className="block text-[13px] font-bold tracking-[0.14em]">{s.t}</span>
            <span className="mt-1 block text-[10.5px] tracking-[0.18em] text-white/60">{s.d}</span>
          </span>
        </span>
      ))}

      <div
        data-cover-book
        className="relative flex aspect-[0.71] h-[min(68svh,560px)] flex-col items-center overflow-hidden rounded-[22px_30px_30px_22px] bg-[linear-gradient(150deg,#3a24c4_0%,#1d0f63_55%,#120a3f_100%)] px-[9%] py-[10%] text-white shadow-[0_60px_120px_-40px_rgba(0,0,0,0.8),inset_6px_0_0_rgba(0,0,0,0.25)] ring-1 ring-white/10"
      >
        {/* guilloche pattern */}
        <svg viewBox="0 0 200 280" className="absolute inset-0 size-full opacity-25" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 14 }, (_, i) => (
            <ellipse key={i} cx="100" cy="130" rx={20 + i * 9} ry={14 + i * 7} fill="none" stroke="#F5D832" strokeWidth="0.5" transform={`rotate(${i * 7} 100 130)`} />
          ))}
        </svg>
        <span className="absolute inset-y-0 left-0 w-[10px] bg-black/25" />
        <p className="relative whitespace-nowrap font-mono text-[12px] tracking-[0.38em] text-accent">STUDENT · CAMPUS</p>
        <div className="relative mt-[14%] grid aspect-square w-[34%] place-items-center rounded-full border border-accent/70 shadow-[0_0_0_10px_rgba(245,216,50,0.08)]">
          <LogoMark className="size-[46%]" />
        </div>
        <p className="relative mt-[12%] text-[clamp(22px,2.6vw,34px)] font-semibold leading-none tracking-[0.18em] text-accent">CREDIT</p>
        <p className="relative mt-2 text-[clamp(22px,2.6vw,34px)] font-semibold leading-none tracking-[0.18em] text-accent">PASSPORT</p>
        <p className="relative mt-4 text-[13px] tracking-[0.3em] text-white/70">{BRAND.name.toUpperCase()}</p>
        <p className="relative mt-auto w-full truncate text-center font-mono text-[10px] tracking-[0.1em] text-white/35">P&lt;KRD&lt;STUDENT&lt;&lt;SAMPLE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
      </div>
    </div>
  );
}
