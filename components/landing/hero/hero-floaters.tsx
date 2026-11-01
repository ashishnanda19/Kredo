import { cn } from "@/lib/utils";

/**
 * Decorative 3D-style objects from campus life that frame the hero headline on the first screen (original vector
 * art, no WebGL): a cutting-chai glass, a canteen receipt, a due-date tile and the Kredo card. Each one bobs
 * gently (CSS), follows the pointer by its own depth (--px/--py set on the hero), pops in on load, and flies
 * outward during the scroll intro (GSAP reads data-fx/data-fy, in viewport widths/heights).
 */
/** Cutting chai in a ribbed glass, the canteen staple. */
function Chai({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 190" className={className}>
      <defs>
        <linearGradient id="hf-tea" x1="0" x2="1">
          <stop offset="0" stopColor="#9A5418" />
          <stop offset=".45" stopColor="#D08A3C" />
          <stop offset="1" stopColor="#7A3E0E" />
        </linearGradient>
        <linearGradient id="hf-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
          <stop offset=".5" stopColor="#ffffff" stopOpacity=".15" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".45" />
        </linearGradient>
      </defs>
      {/* steam */}
      {[46, 70, 94].map((x, i) => (
        <path key={x} d={`M${x} 52 c -10 -10 10 -18 0 -30 c -8 -10 6 -16 2 -22`} fill="none" stroke="#9a9aa2" strokeOpacity={0.35 - i * 0.05} strokeWidth="4" strokeLinecap="round" />
      ))}
      <ellipse cx="70" cy="178" rx="40" ry="7" fill="#000" opacity=".12" />
      {/* tea */}
      <path d="M26 74 L114 74 L102 172 Q70 180 38 172Z" fill="url(#hf-tea)" />
      <ellipse cx="70" cy="74" rx="44" ry="9" fill="#E7A65A" />
      <ellipse cx="62" cy="72" rx="20" ry="3" fill="#F6CF94" opacity=".7" />
      {/* glass with ribs */}
      <path d="M20 58 L120 58 L104 174 Q70 184 36 174Z" fill="url(#hf-glass)" stroke="#ffffff" strokeOpacity=".7" strokeWidth="2" />
      {[34, 48, 62, 76, 90, 104].map((x, i) => (
        <path key={x} d={`M${x} 60 L${x + (i - 2.5) * -2.2} 176`} stroke="#ffffff" strokeOpacity=".35" strokeWidth="3" />
      ))}
      <ellipse cx="70" cy="58" rx="50" ry="10" fill="none" stroke="#ffffff" strokeOpacity=".9" strokeWidth="3" />
    </svg>
  );
}

/** A canteen receipt with a zigzag tear and a yellow PAID stamp. */
function Receipt({ className }: { className?: string }) {
  const zig = Array.from({ length: 10 }, (_, i) => `L${12 + i * 12 + 6} 176 L${12 + (i + 1) * 12} 168`).join(" ");
  return (
    <svg viewBox="0 0 144 190" className={className}>
      <path d={`M12 8 L132 8 L132 168 ${zig.replace(/L132 168$/, "")} L12 168Z`} fill="#ffffff" />
      <path d="M12 8 L132 8 L132 168 L12 168Z" fill="none" />
      <text x="72" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0b0b0c" fontFamily="system-ui, sans-serif" letterSpacing="1.5">CAMPUS CAFE</text>
      {[50, 62, 74].map((y, i) => (
        <g key={y}>
          <rect x="24" y={y} width={[52, 40, 46][i]} height="5" rx="2.5" fill="#d9d9de" />
          <rect x={[100, 106, 102][i]} y={y} width={[20, 14, 18][i]} height="5" rx="2.5" fill="#d9d9de" />
        </g>
      ))}
      <path d="M24 92 H120" stroke="#0b0b0c" strokeOpacity=".15" strokeDasharray="3 3" />
      <text x="24" y="118" fontSize="11" fill="#6b6b70" fontFamily="system-ui, sans-serif">Total</text>
      <text x="120" y="120" textAnchor="end" fontSize="20" fontWeight="800" fill="#0b0b0c" fontFamily="system-ui, sans-serif">₹120</text>
      <g transform="rotate(-14 76 146)">
        <rect x="46" y="132" width="62" height="26" rx="6" fill="none" stroke="#E8C21E" strokeWidth="3" />
        <text x="77" y="151" textAnchor="middle" fontSize="15" fontWeight="800" fill="#C9A100" fontFamily="system-ui, sans-serif" letterSpacing="2">PAID</text>
      </g>
    </svg>
  );
}

/** A due-date calendar tile, the reminder you never miss. */
function DueTile({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[22%] bg-white text-center shadow-[0_30px_50px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/5", className)}>
      <p className="bg-accent py-[7%] text-[clamp(10px,1vw,14px)] font-bold tracking-[0.2em] text-accent-ink">NOV</p>
      <p className="pt-[4%] text-[clamp(30px,3.6vw,54px)] font-bold leading-none tracking-[-0.04em] text-[#0b0b0c]">02</p>
      <p className="pb-[10%] pt-[5%] text-[clamp(9px,0.85vw,12px)] font-semibold text-[#6b6b70]">Due date</p>
    </div>
  );
}

function Card({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-[1.586/1] overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#26262e_0%,#0b0b0c_70%)] p-[7%] text-white shadow-[0_40px_60px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/10", className)}>
      <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.14)_45%,transparent_60%)]" />
      <span className="flex items-center gap-1.5 text-[clamp(10px,1vw,14px)] font-semibold">
        <span className="grid size-[1.6em] place-items-center rounded-[0.4em] bg-white text-[0.8em] font-bold text-[#0b0b0c]">K</span> Kredo
      </span>
      <span className="mt-[9%] block h-[22%] w-[18%] rounded-[6px] bg-[linear-gradient(135deg,#f8e57a,#e8c21e)]" />
      <span className="absolute bottom-[10%] left-[7%] font-mono text-[clamp(9px,0.95vw,13px)] tracking-[0.18em] text-white/80">•••• 0042</span>
    </div>
  );
}

const ITEMS = [
  { key: "chai", el: <Chai className="size-full drop-shadow-[0_24px_28px_rgba(122,62,14,0.25)]" />, pos: "left-[10%] top-[52%] w-[clamp(70px,8.5vw,128px)] max-sm:left-[5%] max-sm:top-[62%]", tilt: "rotate(-8deg)", depth: 26, fx: -0.35, fy: -0.25, delay: 500, dur: 6 },
  { key: "due", el: <DueTile className="w-full" />, pos: "right-[13%] top-[50%] w-[clamp(74px,8vw,124px)] max-sm:right-[6%] max-sm:top-[59%]", tilt: "rotate(12deg) rotateY(-18deg)", depth: 18, fx: 0.35, fy: -0.25, delay: 650, dur: 7 },
  { key: "receipt", el: <Receipt className="size-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.18)]" />, pos: "left-[25%] bottom-[1%] w-[clamp(84px,10vw,150px)] max-sm:left-[-3%] max-sm:bottom-[2%]", tilt: "rotate(-16deg) rotateX(18deg)", depth: 34, fx: -0.3, fy: 0.3, delay: 800, dur: 8 },
  { key: "card", el: <Card className="w-full" />, pos: "right-[26%] bottom-[5%] w-[clamp(150px,17vw,270px)] max-sm:right-[-12%] max-sm:bottom-[14%]", tilt: "rotate(-12deg) rotateY(-24deg) rotateX(14deg)", depth: 22, fx: 0.35, fy: 0.3, delay: 950, dur: 7.5 },
] as const;

export function HeroFloaters() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [perspective:1200px]">
      {/* soft colour wash behind the headline, fades with the floaters */}
      <div data-floater className="absolute inset-0" data-fx="0" data-fy="0">
        <div className="absolute left-1/2 top-[34%] h-[60vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(245,216,50,0.22),transparent)]" />
        <div className="absolute left-[30%] top-[55%] h-[50vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(58,31,184,0.08),transparent)]" />
      </div>
      {ITEMS.map((it) => (
        <div key={it.key} data-floater data-fx={it.fx} data-fy={it.fy} className={cn("absolute", it.pos)}>
          {/* pointer parallax (depth) */}
          <div style={{ transform: `translate3d(calc(var(--px, 0) * ${it.depth}px), calc(var(--py, 0) * ${it.depth}px), 0)`, transition: "transform 0.4s var(--ease-out)" }}>
            {/* load pop-in, then an endless gentle bob */}
            <div className="hero-pop" style={{ animationDelay: `${it.delay}ms` }}>
              <div className="hero-bob" style={{ animationDuration: `${it.dur}s`, transform: it.tilt, transformStyle: "preserve-3d" }}>
                {it.el}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
