"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CARD_H, CARD_W, makeBackTexture, makeBadgeTexture, makeFrontTexture, roundedFaceGeometry, roundedRectShape } from "./card-textures";
import type { Tier } from "@/lib/theme";

const DEPTH = 0.05;
const BEVEL = 0.012;
const RADIUS = 0.17;

export interface CardMeshHandle {
  /** outer group: position/rotation/scale are driven by the parent */
  group: THREE.Group;
  setOpacity: (o: number) => void;
  setBadge: (v: number) => void;
  setPulse: (v: number) => void;
}

interface CreditCardMeshProps {
  name: string;
  number: string;
  tier: Tier;
}

/**
 * The 3D virtual card: an extruded rounded slab (glass / iridescent edge) with a front and back
 * face textured from generated canvases, a glowing verified badge and a "tap" ripple.
 * It does no positioning itself; the parent drives `handle.group` each frame.
 */
export const CreditCardMesh = forwardRef<CardMeshHandle, CreditCardMeshProps>(function CreditCardMesh({ name, number, tier }, ref) {
  const group = useRef<THREE.Group>(null);
  const badge = useRef<THREE.Group>(null);
  const ripple = useRef<THREE.Mesh>(null);

  const { front, back, badgeTex, bodyGeo, faceGeo } = useMemo(
    () => ({
      front: makeFrontTexture(name, number),
      back: makeBackTexture(),
      badgeTex: makeBadgeTexture(),
      bodyGeo: new THREE.ExtrudeGeometry(roundedRectShape(CARD_W, CARD_H, RADIUS), {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: BEVEL,
        bevelSize: BEVEL,
        bevelSegments: 3,
        curveSegments: 14,
      }),
      faceGeo: roundedFaceGeometry(CARD_W, CARD_H, RADIUS),
    }),
    [name, number],
  );

  const mats = useMemo(() => {
    const high = tier === "high";
    const face = (map: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.26,
        metalness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        iridescence: 0.85,
        iridescenceIOR: 1.4,
        iridescenceThicknessRange: [120, 420],
        envMapIntensity: 1.25,
        transparent: true,
      });
    const body = new THREE.MeshPhysicalMaterial({
      color: "#5b21b6",
      roughness: 0.18,
      metalness: 0.25,
      clearcoat: 1,
      iridescence: 1,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [200, 600],
      envMapIntensity: 1.4,
      transparent: true,
      // transmission needs an extra render pass: high tier only
      ...(high ? { transmission: 0.55, thickness: 0.4, ior: 1.4 } : {}),
    });
    return { front: face(front), back: face(back), body };
  }, [front, back, tier]);

  // dispose GPU resources on unmount
  useEffect(
    () => () => {
      [front, back, badgeTex].forEach((t) => t.dispose());
      [bodyGeo, faceGeo].forEach((g) => g.dispose());
      Object.values(mats).forEach((m) => m.dispose());
    },
    [front, back, badgeTex, bodyGeo, faceGeo, mats],
  );

  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return group.current as THREE.Group;
      },
      setOpacity(o: number) {
        mats.front.opacity = o;
        mats.back.opacity = o;
        mats.body.opacity = o;
        if (group.current) group.current.visible = o > 0.01;
      },
      setBadge(v: number) {
        const b = badge.current;
        if (!b) return;
        b.visible = v > 0.01;
        b.scale.setScalar(0.4 + v * 0.8);
      },
      setPulse(v: number) {
        const r = ripple.current;
        if (!r) return;
        const live = v > 0 && v < 1;
        r.visible = live;
        if (live) {
          r.scale.setScalar(1 + v * 0.55);
          (r.material as THREE.MeshBasicMaterial).opacity = (1 - v) * 0.9;
        }
      },
    }),
    [mats],
  );

  // gentle shimmer on the iridescent faces
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    mats.front.iridescenceThicknessRange = [120 + Math.sin(t * 0.8) * 60, 420 + Math.cos(t * 0.6) * 80];
  });

  const zFront = DEPTH + BEVEL + 0.002;

  return (
    <group ref={group}>
      {/* slab, centred on z = 0 */}
      <mesh geometry={bodyGeo} material={mats.body} position={[0, 0, -DEPTH / 2]} />
      <mesh geometry={faceGeo} material={mats.front} position={[0, 0, zFront - DEPTH / 2]} />
      <mesh geometry={faceGeo} material={mats.back} position={[0, 0, -(zFront - DEPTH / 2)]} rotation={[0, Math.PI, 0]} />

      {/* verified badge (front, right of centre) */}
      <group ref={badge} position={[1.02, 0.18, zFront + 0.03]} visible={false}>
        <mesh>
          <circleGeometry args={[0.3, 40]} />
          <meshBasicMaterial map={badgeTex} transparent toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.005]}>
          <circleGeometry args={[0.46, 40]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      {/* tap ripple, lies just behind the card */}
      <mesh ref={ripple} position={[0, 0, -0.2]} visible={false}>
        <ringGeometry args={[CARD_W * 0.56, CARD_W * 0.585, 72]} />
        <meshBasicMaterial color="#f0abfc" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
});
