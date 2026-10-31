"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { damp } from "./damp";
import * as THREE from "three";
import { cardRig, gaugeValue } from "@/components/landing/scenes/card-rig";
import { student } from "@/lib/mock-data";
import type { Tier } from "@/lib/theme";
import { CARD_W } from "./card-textures";
import { CreditCardMesh, type CardMeshHandle } from "./credit-card-mesh";
import { NeonEnv } from "./neon-env";
import { ScoreGauge3D } from "./score-gauge-3d";

/** Reads the card rig (written by GSAP ScrollTrigger) and poses the card every frame. */
function RigCard({ tier, onFirstFrame }: { tier: Tier; onFirstFrame: () => void }) {
  const handle = useRef<CardMeshHandle>(null);
  const viewport = useThree((s) => s.viewport);
  const tilt = useRef({ x: 0, y: 0 });
  const first = useRef(true);

  useFrame((s, dt) => {
    const h = handle.current;
    if (!h?.group) return;
    const { pose: p, pointer, drag } = cardRig;
    const scale = (p.w * viewport.width) / CARD_W;
    const t = s.clock.elapsedTime;

    damp(tilt.current, "x", pointer.y * 0.16, 0.25, dt);
    damp(tilt.current, "y", pointer.x * 0.26 + drag.y, 0.25, dt);

    const g = h.group;
    g.position.set(p.x * (viewport.width / 2), p.y * (viewport.height / 2) + Math.sin(t * 1.1) * 0.04 * scale, 0);
    g.scale.setScalar(scale);
    g.rotation.set(p.rotX + tilt.current.x + Math.sin(t * 0.7) * 0.02, p.rotY + tilt.current.y + Math.sin(t * 0.5) * 0.03, p.rotZ, "ZXY");
    h.setOpacity(p.opacity);
    h.setBadge(p.badge);
    h.setPulse(p.pulse);

    if (first.current) {
      first.current = false;
      onFirstFrame();
    }
  });

  return <CreditCardMesh ref={handle} name={student.name} number="•••• •••• •••• 0042" tier={tier} />;
}

/** The score section's 3D gauge lives in this same canvas, positioned over a DOM anchor each frame. */
function LandingGauge() {
  const group = useRef<THREE.Group>(null);
  const { viewport, size } = useThree((s) => ({ viewport: s.viewport, size: s.size }));
  const value = useSyncExternalStore(gaugeValue.subscribe, gaugeValue.get, () => 62);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const { anchor, visible } = cardRig.gauge;
    g.visible = visible && !!anchor;
    if (!g.visible || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    g.position.set((cx / size.width - 0.5) * viewport.width, -(cy / size.height - 0.5) * viewport.height, 0.4);
    g.scale.setScalar(((r.width / size.width) * viewport.width * 0.5) / 1.25);
  });

  return (
    <group ref={group} visible={false}>
      <ScoreGauge3D value={value} />
    </group>
  );
}

interface LandingCanvasProps {
  tier: Tier;
  /** false pauses rendering (tab hidden, or nothing visible) */
  active: boolean;
  onFirstFrame: () => void;
}

/**
 * The ONE persistent WebGL canvas on the landing page: fixed, click-through, decorative.
 * Performance guard: PerformanceMonitor drops bloom first, then lowers the pixel ratio.
 */
export default function LandingCanvas({ tier, active, onFirstFrame }: LandingCanvasProps) {
  const [level, setLevel] = useState(0); // 2 = dpr capped at 1
  const dprMax = level >= 2 ? 1 : tier === "high" ? 2 : 1.5;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[20]">
      <Canvas
        dpr={[1, dprMax]}
        frameloop={active ? "always" : "never"}
        camera={{ fov: 35, position: [0, 0, 6.5] }}
        gl={{ alpha: true, antialias: tier === "high", powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <PerformanceMonitor onDecline={() => setLevel((l) => Math.min(2, l + 1))} flipflops={2} />
        <NeonEnv tier={tier} />
        <RigCard tier={tier} onFirstFrame={onFirstFrame} />
        <LandingGauge />
      </Canvas>
    </div>
  );
}
