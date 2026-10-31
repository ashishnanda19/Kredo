"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { HAND_BOX, HERO_HAND_IMAGE, PHONE_SCREEN } from "@/lib/hero-config";
import { cn } from "@/lib/utils";

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const S = PHONE_SCREEN;
const screenBox = { left: pct(S.x, HAND_BOX.w), top: pct(S.y, HAND_BOX.h), width: pct(S.w, HAND_BOX.w), height: pct(S.h, HAND_BOX.h) };
const screenRadius = `${(S.radius / S.w) * 100}% / ${(S.radius / S.h) * 100}%`;

const noop = () => () => {};
const useDebug = () => useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).has("debug"), () => false);

/** Bezel around the screen in the SVG fallback, in art units. */
const BZ = 18;

/** Original flat hand (no photo): palm and sleeve sit behind the phone, fingers and thumb in front of its edges. */
function HandBack() {
  return (
    <svg viewBox={`0 0 ${HAND_BOX.w} ${HAND_BOX.h}`} className="absolute inset-0 size-full" aria-hidden>
      <path d="M420 1400 L455 1150 C 470 1060 520 1010 600 1000 C 690 990 760 1040 770 1120 L 800 1400 Z" fill="#E2A985" />
      <ellipse cx="575" cy="1010" rx="245" ry="165" fill="#E9B48F" />
      <path d="M400 1300 C 520 1270 690 1270 820 1300 L 840 1400 L 390 1400 Z" fill="#1d1d22" />
      <path d="M404 1290 C 520 1262 690 1262 818 1290" stroke="#2b2b31" strokeWidth="14" fill="none" />
    </svg>
  );
}

function HandFront() {
  // fingertips curl round the left edge (pinky shortest); the thumb rests on the right edge
  const fingers: [number, number][] = [[650, 96], [722, 100], [794, 96], [866, 84]];
  return (
    <svg viewBox={`0 0 ${HAND_BOX.w} ${HAND_BOX.h}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      <defs>
        <linearGradient id="hp-finger" x1="0" x2="1">
          <stop offset="0" stopColor="#C98A63" />
          <stop offset=".55" stopColor="#E7B08A" />
          <stop offset="1" stopColor="#F0C3A2" />
        </linearGradient>
        <linearGradient id="hp-thumb" x1="1" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor="#D69B75" />
          <stop offset="1" stopColor="#EDBD9B" />
        </linearGradient>
      </defs>
      {fingers.map(([y, w]) => (
        <g key={y}>
          <rect x={306 - w} y={y} width={w} height="62" rx="31" fill="url(#hp-finger)" />
          <path d={`M${306 - w + 22} ${y + 61} h${w - 44}`} stroke="#B8774F" strokeOpacity=".25" strokeWidth="3" />
        </g>
      ))}
      <path d="M790 1110 C 770 1040 740 980 712 940 C 698 918 712 894 738 900 C 770 908 800 960 830 1010 C 850 1045 860 1080 856 1110 Z" fill="url(#hp-thumb)" />
    </svg>
  );
}

/**
 * L3–L5: the hand holding the phone, with the live screen (L4) placed on the glass and a soft glare (L5) on top.
 * Uses the supplied photo when HERO_HAND_IMAGE is set, otherwise the SVG fallback. `?debug=1` outlines PHONE_SCREEN.
 */
export function HandPhone({ children, className, dark }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  const debug = useDebug();
  return (
    <div className={cn("relative", className)} style={{ aspectRatio: `${HAND_BOX.w} / ${HAND_BOX.h}` }}>
      {HERO_HAND_IMAGE ? (
        <Image src={HERO_HAND_IMAGE} alt="" fill priority sizes="(min-width: 1024px) 560px, 90vw" className="pointer-events-none select-none object-contain" />
      ) : (
        <>
          <HandBack />
          <div
            aria-hidden
            className={cn("absolute bg-[#0d0d10] ring-1 ring-black/40 transition-shadow duration-700", dark ? "shadow-[0_40px_120px_-30px_rgba(120,90,255,0.55)]" : "shadow-[0_40px_90px_-30px_rgba(0,0,0,0.5)]")}
            style={{
              left: pct(S.x - BZ, HAND_BOX.w),
              top: pct(S.y - BZ, HAND_BOX.h),
              width: pct(S.w + BZ * 2, HAND_BOX.w),
              height: pct(S.h + BZ * 2, HAND_BOX.h),
              borderRadius: `${((S.radius + BZ) / (S.w + BZ * 2)) * 100}% / ${((S.radius + BZ) / (S.h + BZ * 2)) * 100}%`,
            }}
          />
        </>
      )}
      <div className="absolute overflow-hidden" style={{ ...screenBox, borderRadius: screenRadius }}>
        {children}
        {!HERO_HAND_IMAGE && <span aria-hidden className="absolute left-1/2 top-[1.5%] z-20 h-[3.6%] w-[31%] -translate-x-1/2 rounded-full bg-black" />}
        <span aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(115deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_38%)]" />
      </div>
      {!HERO_HAND_IMAGE && <HandFront />}
      {debug && (
        <div className="pointer-events-none absolute z-30 outline-2 outline-dashed outline-[#ef4444]" style={{ ...screenBox, borderRadius: screenRadius }}>
          <span className="absolute -top-6 left-0 rounded bg-[#ef4444] px-1.5 text-[11px] font-mono text-white">
            PHONE_SCREEN {S.x},{S.y} {S.w}×{S.h} r{S.radius}
          </span>
        </div>
      )}
    </div>
  );
}
