"use client";

import { useRef } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Tier } from "@/lib/theme";

/**
 * Club lighting. No HDRI file: the environment map is generated from coloured Lightformers
 * (tiny 64px cube), and three neon point lights slowly sweep across the scene so reflections
 * slide over the card like stage lights.
 */
function Sweepers() {
  const a = useRef<THREE.PointLight>(null);
  const b = useRef<THREE.PointLight>(null);
  const c = useRef<THREE.PointLight>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    a.current?.position.set(Math.sin(t * 0.7) * 4.5, Math.cos(t * 0.5) * 2.2, 3.2);
    b.current?.position.set(Math.cos(t * 0.55) * 4.5, Math.sin(t * 0.8) * 2.4, 3.6);
    c.current?.position.set(Math.sin(t * 0.4 + 2) * 5, -1.5 + Math.cos(t * 0.65) * 1.5, 2.8);
  });

  return (
    <>
      <pointLight ref={a} color="#a855f7" intensity={34} distance={14} decay={2} />
      <pointLight ref={b} color="#e11d8f" intensity={30} distance={14} decay={2} />
      <pointLight ref={c} color="#38bdf8" intensity={22} distance={14} decay={2} />
    </>
  );
}

function SweepingStrips({ animate }: { animate: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (animate && g.current) g.current.rotation.y = s.clock.elapsedTime * 0.25;
  });
  return (
    <group ref={g}>
      <Lightformer form="rect" color="#a855f7" intensity={5} position={[-6, 1.5, -2]} rotation-y={Math.PI / 2} scale={[8, 2.2, 1]} />
      <Lightformer form="rect" color="#e11d8f" intensity={5} position={[6, -0.5, -1]} rotation-y={-Math.PI / 2} scale={[8, 2.2, 1]} />
      <Lightformer form="rect" color="#38bdf8" intensity={3.5} position={[0, 4, -3]} rotation-x={Math.PI / 2} scale={[9, 2, 1]} />
      <Lightformer form="ring" color="#ffffff" intensity={2.2} position={[0, 0, 6]} scale={3} />
    </group>
  );
}

export function NeonEnv({ tier }: { tier: Tier }) {
  const high = tier === "high";
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 3, 4]} intensity={0.9} color="#ffffff" />
      <Sweepers />
      {/* high tier re-renders the tiny cube each frame so the strips sweep; others bake it once */}
      <Environment resolution={64} frames={high ? Infinity : 1} environmentIntensity={0.9}>
        <color attach="background" args={["#07050f"]} />
        <SweepingStrips animate={high} />
      </Environment>
    </>
  );
}
