"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { NeonEnv } from "./neon-env";
import type { Tier } from "@/lib/theme";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const PALETTE = ["#fbbf24", "#fbbf24", "#f59e0b", "#a78bfa", "#f0abfc"].map((c) => new THREE.Color(c));

interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rx: number;
  ry: number;
  rz: number;
  ax: number;
  ay: number;
  az: number;
  scale: number;
  delay: number;
}

/** One InstancedMesh, light physics (gravity + drag + spin), fades and shrinks near the end of its life. */
function Coins({ count, onDone }: { count: number; onDone: () => void }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const viewport = useThree((s) => s.viewport);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const clock = useRef(0);
  const finished = useRef(false);

  const coins = useMemo<Coin[]>(() => {
    const r = rng(21);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * viewport.width * 1.05,
      y: viewport.height / 2 + 0.8 + r() * 2.5,
      vx: (r() - 0.5) * 1.4,
      vy: -(1 + r() * 3),
      rx: (r() - 0.5) * 14,
      ry: (r() - 0.5) * 14,
      rz: (r() - 0.5) * 6,
      ax: r() * 6,
      ay: r() * 6,
      az: r() * 6,
      scale: 0.7 + r() * 0.7,
      delay: r() * 1.2,
    }));
  }, [count, viewport.width, viewport.height]);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    coins.forEach((_, i) => m.setColorAt(i, PALETTE[i % PALETTE.length]));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [coins]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    clock.current += Math.min(dt, 0.05);
    const t = clock.current;
    const bottom = -viewport.height / 2 - 1;
    const coinScale = Math.min(1, viewport.width / 9); // smaller coins on narrow screens

    coins.forEach((c, i) => {
      const age = t - c.delay;
      if (age < 0) {
        dummy.scale.setScalar(0);
      } else {
        c.vy -= 9.5 * Math.min(dt, 0.05);
        c.vy *= 0.999;
        c.x += (c.vx + Math.sin(age * 2 + c.ax) * 0.35) * Math.min(dt, 0.05);
        c.y += c.vy * Math.min(dt, 0.05);
        c.ax += c.rx * dt;
        c.ay += c.ry * dt;
        c.az += c.rz * dt;
        const lifeFade = 1 - Math.min(1, Math.max(0, (age - 2.3) / 0.9));
        const edgeFade = Math.min(1, Math.max(0, (c.y - bottom) / 1.5));
        const fade = Math.min(lifeFade, edgeFade);
        dummy.position.set(c.x, c.y, 0);
        dummy.rotation.set(c.ax, c.ay, c.az);
        dummy.scale.setScalar(c.scale * fade * coinScale);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;

    // finished by simulated time (not wall-clock), so slow devices still see the whole shower
    if (!finished.current && t > 1.2 + 3.4) {
      finished.current = true;
      onDone();
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <cylinderGeometry args={[0.3, 0.3, 0.07, 28]} />
      <meshStandardMaterial metalness={0.85} roughness={0.28} envMapIntensity={1.5} />
    </instancedMesh>
  );
}

/** Full-screen, click-through coin shower. Mounted for a few seconds, then removed by its parent. */
export default function CoinShower({ tier, count, onDone }: { tier: Tier; count: number; onDone: () => void }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 12], fov: 40 }} gl={{ alpha: true, antialias: true }} style={{ pointerEvents: "none" }}>
      <NeonEnv tier="mid" />
      <Coins count={count} onDone={onDone} />
      {tier === "high" && <Sparkles count={70} scale={[14, 9, 1]} size={5} speed={0.6} color="#f0abfc" />}
    </Canvas>
  );
}
