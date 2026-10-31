"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { Tier } from "@/lib/theme";
import { ScoreGauge3D } from "./score-gauge-3d";

function FirstFrame({ onFirstFrame }: { onFirstFrame: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      onFirstFrame();
    }
  });
  return null;
}

/** Small WebGL canvas for the dashboard 3D score gauge (the number is an HTML overlay). */
export default function GaugeCanvas({ value, tier, active, onFirstFrame }: { value: number; tier: Tier; active: boolean; onFirstFrame: () => void }) {
  return (
    <Canvas
      dpr={[1, tier === "high" ? 2 : 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 35, position: [0, 0, 4.4] }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: "none" }}
    >
      <ScoreGauge3D value={value} />
      <FirstFrame onFirstFrame={onFirstFrame} />
      {tier === "high" && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.8} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur radius={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
