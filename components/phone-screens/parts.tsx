"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** In-phone UI uses the platform UI font at small sizes with tabular numerals. */
export const SYS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Segoe UI", Roboto, sans-serif';
export const SCREEN_W = 390;
export const SCREEN_H = 844;

/** Renders children at the 390x844 design size and scales them to fill the container width. */
export function ScaledScreen({ children, className, bg = "#fff" }: { children: React.ReactNode; className?: string; bg?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setS(e.contentRect.width / SCREEN_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("relative h-full w-full overflow-hidden", className)} style={{ background: bg }}>
      <div
        className="tnum"
        style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${s})`, transformOrigin: "top left", fontFamily: SYS, opacity: s ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}

export function StatusBar({ dark, time = "9:41" }: { dark?: boolean; time?: string }) {
  const c = dark ? "#fff" : "#0b0b0c";
  return (
    <div className="flex h-[54px] items-end justify-between px-[30px] pb-[8px]" style={{ color: c }} aria-hidden>
      <span className="text-[17px] font-semibold">{time}</span>
      <span className="flex items-center gap-[6px]">
        <svg width="18" height="12" viewBox="0 0 18 12" fill={c}><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill={c}><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.5 1.4l1.2-1.3A6.8 6.8 0 0 0 8 4a6.8 6.8 0 0 0-4.7 1.9l1.2 1.3c1-.9 2.2-1.4 3.5-1.4Zm0 3.6c.5 0 1 .2 1.3.5L8 11.2 6.7 9.9c.3-.3.8-.5 1.3-.5Z" /></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke={c} opacity=".4" /><rect x="2" y="2" width="20" height="9" rx="2" fill={c} /><path d="M25 4.5v4c.8-.3 1.3-1 1.3-2s-.5-1.7-1.3-2Z" fill={c} opacity=".5" /></svg>
      </span>
    </div>
  );
}

export function Dot({ c, className }: { c: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-[9px] shrink-0 rounded-full", className)} style={{ background: c }} />;
}

/** Soft green/blue vector campus map (original artwork). Pins are vendor locations. */
export function CampusMap({ height = 520, zoom = 1, showArc = true }: { height?: number; zoom?: number; showArc?: boolean }) {
  return (
    <svg viewBox="0 0 390 520" width="390" height={height} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g transform={`translate(195 260) scale(${zoom}) translate(-195 -260)`}>
        <rect width="390" height="520" fill="#EAF1E4" />
        <path d="M-20 360c60-30 110 10 170-12s90-70 160-58 110 50 110 50v200H-20Z" fill="#CFE6F7" />
        <path d="M250 40c40 0 80 30 90 70s-20 70-60 70-70-20-80-55 10-85 50-85Z" fill="#D3EACB" />
        <path d="M30 120c30-20 80-10 90 20s-10 60-45 60-60-10-65-35 0-35 20-45Z" fill="#D3EACB" />
        <path d="M-10 230 400 190M120-10l40 540M300-10l-60 540M-10 90l400 60" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
        <path d="M-10 230 400 190M120-10l40 540M300-10l-60 540M-10 90l400 60" stroke="#E2E6DE" strokeWidth="1" />
        {[[150, 150, 60, 38], [180, 250, 46, 30], [60, 260, 50, 34], [260, 230, 40, 44], [200, 60, 52, 30]].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="#F7F7F2" stroke="#E3E5DD" />
        ))}
        {showArc && <path d="M92 300C130 200 230 170 296 120" fill="none" stroke="#2F7DF6" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />}
        <circle cx="92" cy="300" r="14" fill="#2F7DF6" opacity=".18" />
        <circle cx="92" cy="300" r="7" fill="#2F7DF6" stroke="#fff" strokeWidth="3" />
        {[[296, 120, "#0B0B0C"], [205, 205, "#F5D832"], [250, 300, "#22C55E"], [70, 180, "#EF4444"]].map(([x, y, c], i) => (
          <g key={i}>
            <circle cx={x as number} cy={y as number} r="13" fill="#fff" stroke="rgba(0,0,0,.08)" />
            <circle cx={x as number} cy={y as number} r="6" fill={c as string} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Small round icon button used on maps. */
export function MapButton({ children }: { children: React.ReactNode }) {
  return <span className="grid size-[40px] place-items-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)]">{children}</span>;
}
