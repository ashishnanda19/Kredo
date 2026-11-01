import { CampusPayScreen, PhoneFrame } from "@/components/phone-screens";
import { LogoMark, Wordmark } from "@/components/shared/logo";
import { BRAND } from "@/lib/config";

const QR_N = 25;

/** Module path for the decorative QR: a fixed pseudo-random fill that skips the three finder corners. */
const QR_PATH = (() => {
  const n = QR_N;
  const finder = (x: number, y: number) => x < 7 && y < 7;
  const inFinder = (x: number, y: number) => finder(x, y) || finder(n - 1 - x, y) || finder(x, n - 1 - y);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let d = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (inFinder(x, y)) continue;
      if (rnd() > 0.52) d += `M${x} ${y}h1v1h-1z`;
    }
  return d;
})();

/** A decorative QR (not scannable): three finder squares and a fixed fill. */
function Qr() {
  const n = QR_N;
  const d = QR_PATH;
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width="6" height="6" rx="1.4" fill="none" stroke="#0b0b0c" strokeWidth="1" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.7" fill="#0b0b0c" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="block size-full" shapeRendering="crispEdges">
      <path d={d} fill="#0b0b0c" />
      {eye(0, 0)}
      {eye(n - 7, 0)}
      {eye(0, n - 7)}
      <rect x="10" y="10" width="5" height="5" rx="1.2" fill="#fff" />
      <rect x="10.8" y="10.8" width="3.4" height="3.4" rx="0.9" fill="#F5D832" />
    </svg>
  );
}

/** The vendor's counter stand: "scan and pay" with the campus stall's QR. */
function Standee() {
  return (
    <div className="[container-type:inline-size]">
      <div
        className="relative rounded-[9cqw] bg-white p-[8cqw] text-[#0b0b0c]"
        style={{
          boxShadow:
            "-1px 1px 0 #ece6d2,-2px 2px 0 #e6dfc8,-3px 3px 0 #ddd5bb,-4px 4px 0 #d4cbad,-5px 5px 0 #cbc19f,0 40px 60px -28px rgba(110,80,0,0.55)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[7cqw] font-semibold tracking-[-0.02em]">Campus Cafe</span>
          <LogoMark className="size-[10cqw]" />
        </div>
        <p className="mt-[1cqw] text-[4.6cqw] text-[#6b6b70]">On campus · counter 2</p>
        <div className="relative mt-[6cqw] rounded-[5cqw] bg-white p-[5cqw] ring-1 ring-black/10">
          <Qr />
          {/* scan line (driven by the splash scroll timeline) */}
          <span
            data-sc-scan
            className="absolute inset-x-[3cqw] top-[5cqw] h-[1.2cqw] rounded-full bg-accent opacity-0 shadow-[0_0_4cqw_1.4cqw_rgba(245,216,50,0.7)]"
          />
        </div>
        <p className="mt-[6cqw] text-center text-[8cqw] font-semibold leading-none tracking-[-0.03em]">Scan &amp; pay</p>
        <p className="mt-[2.5cqw] text-center text-[4.6cqw] text-[#6b6b70]">{BRAND.name} accepted here</p>
      </div>
      {/* acrylic foot */}
      <div className="mx-auto h-[7cqw] w-[78%] rounded-b-[4cqw] bg-[linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.25))] shadow-[0_10px_20px_-10px_rgba(110,80,0,0.5)]" />
    </div>
  );
}

/** The Kredo student card. */
function Card() {
  return (
    <div className="[container-type:inline-size]">
      <div
        className="relative aspect-[1.586/1] overflow-hidden rounded-[6cqw] bg-[linear-gradient(140deg,#2c2c33_0%,#121215_55%,#0b0b0c_100%)] text-white"
        style={{
          boxShadow:
            "0 1px 0 #1d1d22,0 2px 0 #19191d,0 3px 0 #151518,0 4px 0 #121214,0 40px 50px -26px rgba(60,40,0,0.6)",
        }}
      >
        <span className="absolute inset-y-0 right-0 w-[30%] bg-accent [clip-path:polygon(38%_0,100%_0,100%_100%,0_100%)]" />
        <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.16)_45%,transparent_60%)]" />
        <span className="absolute left-[7%] top-[11%] flex items-center gap-[2.4cqw]">
          <LogoMark className="size-[9cqw]" />
          <Wordmark className="h-[4.7cqw]" />
        </span>
        <span className="absolute left-[7%] top-[42%] h-[18%] w-[13%] rounded-[2cqw] bg-[linear-gradient(135deg,#f9e88a,#d9b31a)] shadow-[inset_0_0_0_0.4cqw_rgba(0,0,0,0.15)]" />
        <span className="absolute bottom-[11%] left-[7%] text-[3.6cqw] font-semibold tracking-[0.2em] text-white/60">STUDENT</span>
        <span className="absolute bottom-[10%] right-[34%] font-mono text-[5cqw] tracking-[0.16em] text-white/85">•••• 0042</span>
      </div>
    </div>
  );
}

/** The phone, showing the real pay sheet, with the paid state stacked on top (faded in by the scroll story). */
function Phone() {
  return (
    <div className="relative">
      {/* body thickness */}
      <span className="absolute inset-0 translate-x-[3.5%] translate-y-[0.6%] rounded-[16%/7.4%] bg-[linear-gradient(90deg,#2a2a31,#121216)]" />
      <PhoneFrame className="w-full">
        <div className="relative h-full">
          <div className="absolute inset-0">
            <CampusPayScreen phase="sheet" />
          </div>
          <div data-sc-paid-screen className="absolute inset-0 opacity-0">
            <CampusPayScreen phase="paid" />
          </div>
        </div>
      </PhoneFrame>
      {/* glass glare */}
      <span className="pointer-events-none absolute inset-[2.6%_3.6%] rounded-[13%/6%] bg-[linear-gradient(120deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_32%)]" />
    </div>
  );
}

/**
 * The splash's product scene: paying at a campus stall. A vendor's "scan & pay" stand, a phone showing the
 * real Kredo pay sheet, and the Kredo card, composed as one still life on a soft floor shadow (CSS 3D, no WebGL).
 * Each object enters in turn on load, then floats on its own clock. Scrolling plays the payment (hero-scene.tsx
 * drives the data-sc-* hooks): the phone turns to the stand, the scan line sweeps the QR, the sheet flips to
 * "Paid", a check bursts, and the scene breaks apart into the white wipe.
 */
export function SplashScene() {
  return (
    <div aria-hidden className="relative aspect-[1/1.02] w-full select-none">
      <div className="absolute bottom-[2%] left-1/2 h-[12%] w-[86%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(110,80,0,0.32),rgba(110,80,0,0))]" />

      {/* back: the stand */}
      <div data-floater data-fx="-0.4" data-fy="-0.2" className="absolute left-[3%] top-[13%] w-[42%]">
        <div className="sc-rise" style={{ animationDelay: "280ms" }}>
          <div className="sc-float" style={{ animationDuration: "9s", animationDelay: "-2s" }}>
            <div style={{ transform: "perspective(1600px) rotateY(24deg) rotateX(4deg) rotateZ(-2deg)" }}>
              <Standee />
            </div>
          </div>
        </div>
      </div>

      {/* middle: the phone */}
      <div data-floater data-sc-phone data-fx="0.45" data-fy="-0.25" className="absolute right-[7%] top-0 z-10 w-[40%]">
        <div className="sc-rise" style={{ animationDelay: "420ms" }}>
          <div className="sc-float" style={{ animationDuration: "8s" }}>
            <div style={{ transform: "perspective(1600px) rotateY(-20deg) rotateX(6deg) rotateZ(3deg)" }}>
              <Phone />
            </div>
          </div>
        </div>
      </div>

      {/* paid ripple: radiates from the check on the phone's "Paid" sheet */}
      <div data-sc-burst className="absolute left-[60.3%] top-[62%] z-30 size-[10%] opacity-0">
        <span data-sc-ring className="absolute inset-0 rounded-full border-[2.5px] border-[#22C55E]" />
        <span data-sc-ring className="absolute inset-0 rounded-full bg-[#22C55E]/25" />
      </div>

      {/* front: the card */}
      <div data-floater data-sc-card data-fx="-0.35" data-fy="0.45" className="absolute bottom-[3%] left-0 z-20 w-[46%]">
        <div className="sc-rise" style={{ animationDelay: "560ms" }}>
          <div className="sc-float" style={{ animationDuration: "10s", animationDelay: "-4s" }}>
            <div style={{ transform: "perspective(1400px) rotateX(46deg) rotateY(-8deg) rotateZ(-9deg)" }}>
              <Card />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
