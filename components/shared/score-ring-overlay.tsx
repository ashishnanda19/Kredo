"use client";

import { Badge } from "@/components/ui/badge";
import { getBand } from "@/lib/score";
import { CountUp } from "./count-up";

/**
 * HTML overlay for a WebGL score ring: the count-up number and band label float in the centre.
 * The ring itself is drawn by R3F (see components/three/score-gauge-3d.tsx); this element is
 * both the layout box and the anchor the 3D ring is positioned over.
 */
export function ScoreRingOverlay({ value, anchorRef }: { value: number; anchorRef?: React.Ref<HTMLDivElement> }) {
  const band = getBand(value);
  return (
    <div ref={anchorRef} role="img" aria-label={`Score ${value} out of 100, band: ${band.label}`} className="relative mx-auto aspect-square w-full max-w-[300px]">
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-6xl font-extrabold leading-none tracking-tight tabular-nums drop-shadow-[0_0_18px_var(--glow-magenta)]">
            <CountUp value={value} immediate />
          </div>
          <div className="mt-2 flex justify-center">
            <Badge tone={band.tone}>{band.label}</Badge>
          </div>
        </div>
      </div>
      <span aria-hidden className="absolute bottom-[6%] left-[16%] text-xs text-muted">
        0
      </span>
      <span aria-hidden className="absolute bottom-[6%] right-[12%] text-xs text-muted">
        100
      </span>
    </div>
  );
}
