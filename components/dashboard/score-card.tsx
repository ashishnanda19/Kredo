"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useInView } from "framer-motion";
import { ArrowUpRight, Lightbulb } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { InfoTip } from "@/components/shared/info-tip";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { ScoreRingOverlay } from "@/components/shared/score-ring-overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY } from "@/lib/copy";
import { score } from "@/lib/mock-data";
import { useGlTier } from "@/lib/quality";
import { getBand } from "@/lib/score";

const GaugeCanvas = dynamic(() => import("@/components/three/gauge-canvas"), { ssr: false });
// Recharts is heavy: only load it on the client
const ScoreTrend = dynamic(() => import("./score-trend"), { ssr: false, loading: () => <Skeleton className="h-20 w-full" /> });

let webgl: boolean | null = null;
function supportsWebGL() {
  if (webgl === null) {
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

export function ScoreCard() {
  const d = COPY.dashboard.score;
  const gl = useGlTier();
  const tier = gl === "pending" ? "low" : gl;
  const band = getBand(score.current);
  const delta = score.current - score.history.at(-2)!.score;
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { margin: "120px" });
  const [ready, setReady] = useState(false);
  const useGl = gl !== "pending" && tier !== "low" && typeof window !== "undefined" && supportsWebGL();

  return (
    <GlassCard role="region" radius="lg" className="h-full p-5" aria-label={d.title}>
      <h2 className="flex items-center gap-1.5 text-base font-bold">
        {d.title}
        <InfoTip text={d.tip} label="What is the score?" />
      </h2>

      {/* 3D ring (WebGL) with the number floating in the centre as HTML; SVG gauge is the fallback */}
      <div ref={stage} className="relative mx-auto mt-2 aspect-square w-full max-w-[250px]">
        {useGl && ready ? (
          <ScoreRingOverlay value={score.current} />
        ) : (
          <div className="grid size-full place-items-center">
            <ScoreGauge value={score.current} className="w-full" />
          </div>
        )}
        {useGl && (
          <div aria-hidden className={ready ? "absolute inset-0" : "pointer-events-none absolute inset-0 opacity-0"}>
            <GaugeCanvas value={score.current} tier={tier} active={inView} onFirstFrame={() => setReady(true)} />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-foreground/[0.07] px-4 py-3">
        <div>
          <p className="text-sm font-bold">{band.blurb}</p>
          <p className="flex items-center gap-1 text-xs font-semibold text-success">
            <ArrowUpRight className="size-3.5" aria-hidden /> Up {delta} since last month
          </p>
        </div>
      </div>

      <ScoreTrend />

      <h3 className="mt-5 flex items-center gap-2 text-sm font-bold">
        <Lightbulb className="size-4 text-warning" aria-hidden /> {d.levelUp}
      </h3>
      <ul className="mt-2 space-y-2">
        {COPY.score.tips.map((t) => (
          <li key={t.title} className="flex items-center justify-between gap-3 text-sm">
            <span>{t.title}</span>
            <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">{t.gain}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
