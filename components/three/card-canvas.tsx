"use client";

import { useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { damp } from "maath/easing";
import type { Tier } from "@/lib/theme";
import { CARD_W } from "./card-textures";
import { CreditCardMesh, type CardMeshHandle } from "./credit-card-mesh";
import { NeonEnv } from "./neon-env";

/** Interaction state written by DOM handlers (pointer tilt, touch drag) and read every frame. */
export interface CardInput {
  flipped: boolean;
  /** cursor position over the card, -1..1 (desktop) */
  px: number;
  py: number;
  /** touch-drag yaw offset in radians (springs back to 0 on release) */
  dragY: number;
}

function Card({ tier, input, name, number, onFirstFrame }: { tier: Tier; input: MutableRefObject<CardInput>; name: string; number: string; onFirstFrame: () => void }) {
  const handle = useRef<CardMeshHandle>(null);
  const viewport = useThree((s) => s.viewport);
  const cur = useRef({ ry: 0, rx: 0 });
  const first = useRef(true);

  useFrame((s, dt) => {
    const h = handle.current;
    if (!h?.group) return;
    const i = input.current;
    const t = s.clock.elapsedTime;
    const target = (i.flipped ? Math.PI : 0) + i.dragY + i.px * 0.32;

    damp(cur.current, "ry", target, 0.3, dt);
    damp(cur.current, "rx", i.py * 0.2, 0.25, dt);

    const scale = (viewport.width * 0.82) / CARD_W;
    const g = h.group;
    g.scale.setScalar(scale);
    g.position.set(0, Math.sin(t * 1.1) * 0.035 * scale, 0);
    g.rotation.set(cur.current.rx + Math.sin(t * 0.7) * 0.025, cur.current.ry + Math.sin(t * 0.5) * 0.03, Math.sin(t * 0.45) * 0.012, "YXZ");
    h.setOpacity(1);
    h.setBadge(0);
    h.setPulse(0);

    if (first.current) {
      first.current = false;
      onFirstFrame();
    }
  });

  return <CreditCardMesh ref={handle} name={name} number={number} tier={tier} />;
}

interface CardCanvasProps {
  tier: Tier;
  active: boolean;
  input: MutableRefObject<CardInput>;
  name: string;
  number: string;
  onFirstFrame: () => void;
}

/** Small WebGL canvas for the dashboard virtual card: tilts toward the cursor, drags on touch, flips on tap. */
export default function CardCanvas({ tier, active, input, name, number, onFirstFrame }: CardCanvasProps) {
  return (
    <Canvas
      dpr={[1, tier === "high" ? 2 : 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 35, position: [0, 0, 6.5] }}
      gl={{ alpha: true, antialias: tier === "high", powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <NeonEnv tier={tier} />
      <Card tier={tier} input={input} name={name} number={number} onFirstFrame={onFirstFrame} />
    </Canvas>
  );
}
