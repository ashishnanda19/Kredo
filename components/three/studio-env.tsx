"use client";

import { useRef } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Tier } from "@/lib/theme";

/**
 * Studio lighting for the gold coins. No HDRI file: the environment map is generated from warm
 * white Lightformers (tiny 64px cube), and three soft point lights sweep slowly so highlights move.
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
      <pointLight ref={a} color="#FFF4D6" intensity={34} distance={14} decay={2} />
      <pointLight ref={b} color="#FFFFFF" intensity={30} distance={14} decay={2} />
      <pointLight ref={c} color="#F5D832" intensity={22} distance={14} decay={2} />
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
      <Lightformer form="rect" color="#FFF4D6" intensity={5} position={[-6, 1.5, -2]} rotation-y={Math.PI / 2} scale={[8, 2.2, 1]} />
      <Lightformer form="rect" color="#FFFFFF" intensity={5} position={[6, -0.5, -1]} rotation-y={-Math.PI / 2} scale={[8, 2.2, 1]} />
      <Lightformer form="rect" color="#F5D832" intensity={3.5} position={[0, 4, -3]} rotation-x={Math.PI / 2} scale={[9, 2, 1]} />
      <Lightformer form="ring" color="#ffffff" intensity={2.2} position={[0, 0, 6]} scale={3} />
    </group>
  );
}

export function StudioEnv({ tier }: { tier: Tier }) {
  const high = tier === "high";
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 3, 4]} intensity={0.9} color="#ffffff" />
      <Sweepers />
      {/* high tier re-renders the tiny cube each frame so the strips sweep; others bake it once */}
      <Environment resolution={64} frames={high ? Infinity : 1} environmentIntensity={0.9}>
        <color attach="background" args={["#111113"]} />
        <SweepingStrips animate={high} />
      </Environment>
    </>
  );
}
