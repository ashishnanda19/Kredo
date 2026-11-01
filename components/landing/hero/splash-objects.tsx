import { cn } from "@/lib/utils";

/**
 * Decorative 3D-style objects from campus life for the opening splash (original vector art, no WebGL): a chai
 * glass, a due-date tile, a xerox stack, a student ID, a canteen receipt and the Kredo card. Each one pops in on
 * load, bobs gently (CSS), follows the pointer by its own depth (--px/--py set on the hero) and flies outward when
 * the splash wipes away (GSAP reads data-fx/data-fy, in viewport widths/heights).
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
      <p className="bg-[#0b0b0c] py-[7%] text-[clamp(10px,1vw,14px)] font-bold tracking-[0.2em] text-accent">NOV</p>
      <p className="pt-[4%] text-[clamp(30px,3.6vw,54px)] font-bold leading-none tracking-[-0.04em] text-[#0b0b0c]">02</p>
      <p className="pb-[10%] pt-[5%] text-[clamp(9px,0.85vw,12px)] font-semibold text-[#6b6b70]">Due date</p>
    </div>
  );
}

/** A student ID card, the thing you verify with. */
function IdCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-[1/1.45] overflow-hidden rounded-[14px] bg-white shadow-[0_30px_50px_-24px_rgba(0,0,0,0.4)] ring-1 ring-black/5", className)}>
      <span className="absolute left-1/2 top-[4%] h-[5%] w-[22%] -translate-x-1/2 rounded-full bg-[#d9d9de]" />
      <div className="mt-[16%] bg-[#0b0b0c] px-[8%] py-[6%] text-[clamp(8px,0.8vw,11px)] font-bold tracking-[0.16em] text-accent">STUDENT ID</div>
      <div className="mx-auto mt-[10%] grid aspect-square w-[44%] place-items-end overflow-hidden rounded-full bg-[#e4e7f0]">
        <svg viewBox="0 0 60 60" className="w-full fill-[#b7bdd1]"><circle cx="30" cy="24" r="12" /><path d="M8 60c2-15 10-22 22-22s20 7 22 22Z" /></svg>
      </div>
      <div className="mx-[12%] mt-[10%] space-y-[6%]">
        <span className="block h-[5px] w-3/4 rounded bg-[#d0d0d6]" />
        <span className="block h-[5px] w-1/2 rounded bg-[#e2e2e7]" />
      </div>
      <span className="absolute bottom-[6%] right-[8%] grid size-[18%] place-items-center rounded-full bg-[#22C55E] text-[clamp(8px,0.8vw,12px)] font-bold text-white">✓</span>
    </div>
  );
}

/** A stack of fresh xerox pages, pre-exam essential. */
function XeroxStack({ className }: { className?: string }) {
  const sheet = (dx: number, dy: number, r: number, k: number, top: boolean) => (
    <g key={k} transform={`translate(${dx} ${dy}) rotate(${r} 70 90)`}>
      <rect x="10" y="10" width="120" height="160" rx="4" fill="#ffffff" stroke="#0b0b0c" strokeOpacity=".08" />
      {top &&
        [34, 48, 62, 76, 90, 104, 118, 132].map((y, i) => (
          <rect key={y} x="24" y={y} width={[80, 92, 70, 88, 60, 90, 76, 50][i]} height="5" rx="2.5" fill="#c9c9cf" />
        ))}
    </g>
  );
  return (
    <svg viewBox="0 0 150 190" className={className}>
      {sheet(10, 6, 8, 0, false)}
      {sheet(4, 3, 3, 1, false)}
      {sheet(0, 0, -3, 2, true)}
      <circle cx="112" cy="40" r="16" fill="#0b0b0c" />
      <text x="112" y="45" textAnchor="middle" fontSize="13" fontWeight="800" fill="#F5D832" fontFamily="system-ui, sans-serif">A4</text>
    </svg>
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
  { key: "chai", el: <Chai className="size-full drop-shadow-[0_28px_30px_rgba(122,62,14,0.35)]" />, pos: "left-[7%] top-[17%] w-[clamp(74px,9vw,140px)] max-sm:left-[3%] max-sm:top-[13%]", tilt: "rotate(-10deg)", depth: 30, fx: -0.45, fy: -0.35, delay: 450, dur: 6 },
  { key: "due", el: <DueTile className="w-full" />, pos: "right-[9%] top-[15%] w-[clamp(72px,8.5vw,128px)] max-sm:right-[4%] max-sm:top-[13%]", tilt: "rotate(12deg) rotateY(-18deg)", depth: 22, fx: 0.45, fy: -0.35, delay: 560, dur: 7 },
  { key: "xerox", el: <XeroxStack className="size-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.2)]" />, pos: "left-[2.5%] top-[46%] w-[clamp(80px,9vw,140px)] max-md:hidden", tilt: "rotate(-14deg) rotateY(20deg)", depth: 18, fx: -0.55, fy: 0, delay: 680, dur: 8 },
  { key: "id", el: <IdCard className="w-full" />, pos: "right-[3%] top-[42%] w-[clamp(70px,7.5vw,116px)] max-md:hidden", tilt: "rotate(14deg) rotateY(-22deg) rotateX(8deg)", depth: 26, fx: 0.55, fy: 0, delay: 780, dur: 7.5 },
  { key: "receipt", el: <Receipt className="size-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.22)]" />, pos: "left-[15%] bottom-[5%] w-[clamp(84px,10vw,150px)] max-sm:left-[2%] max-sm:bottom-[13%]", tilt: "rotate(-16deg) rotateX(18deg)", depth: 36, fx: -0.4, fy: 0.4, delay: 880, dur: 8 },
  { key: "card", el: <Card className="w-full" />, pos: "right-[12%] bottom-[8%] w-[clamp(150px,17vw,270px)] max-sm:right-[-14%] max-sm:bottom-[15%]", tilt: "rotate(-12deg) rotateY(-24deg) rotateX(14deg)", depth: 24, fx: 0.4, fy: 0.4, delay: 980, dur: 7.5 },
] as const;

export function SplashObjects() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 [perspective:1200px]">
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
