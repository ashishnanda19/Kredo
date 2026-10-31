"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "maath/easing";

const R = 1;
const TUBE = 0.11;
const TUBULAR = 200;
const RADIAL = 14;
const ARC = Math.PI * 1.5; // 270 degrees, opening at the bottom
const START = Math.PI * 1.25; // bottom-left end; fills clockwise over the top

class ArcCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = START - t * ARC;
    return target.set(Math.cos(a) * R, Math.sin(a) * R, 0);
  }
}

const VIOLET = new THREE.Color("#8b5cf6");
const MAGENTA = new THREE.Color("#e11d8f");
const BLUE = new THREE.Color("#38bdf8");

function gradientAt(t: number, out: THREE.Color) {
  return t < 0.5 ? out.copy(VIOLET).lerp(MAGENTA, t / 0.5) : out.copy(MAGENTA).lerp(BLUE, (t - 0.5) / 0.5);
}

interface ScoreGauge3DProps {
  /** 0 to 100 */
  value: number;
}

/**
 * 3D score gauge: an emissive tube arc (violet > magenta > blue) with a glowing tip. The fill is
 * clipped with the geometry draw range (cheap, no geometry rebuilds), eases toward `value`,
 * idles with a slow rotation, and pulses its glow whenever the score goes up.
 */
export function ScoreGauge3D({ value }: ScoreGauge3DProps) {
  const group = useRef<THREE.Group>(null);
  const tip = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const fill = useRef<THREE.Mesh>(null);
  const state = useRef({ v: 0, pulse: 0, last: value });

  const { track, fillGeo } = useMemo(() => {
    const path = new ArcCurve();
    const fillGeo = new THREE.TubeGeometry(path, TUBULAR, TUBE, RADIAL, false);
    const colors = new Float32Array(fillGeo.attributes.position.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < fillGeo.attributes.position.count; i++) {
      const seg = Math.floor(i / (RADIAL + 1)) / TUBULAR;
      gradientAt(seg, c);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    fillGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { track: new THREE.TubeGeometry(path, 120, TUBE * 0.7, 10, false), fillGeo };
  }, []);

  useEffect(
    () => () => {
      track.dispose();
      fillGeo.dispose();
    },
    [track, fillGeo],
  );

  // a score increase triggers a glow pulse
  useEffect(() => {
    if (value > state.current.last) state.current.pulse = 1;
    state.current.last = value;
  }, [value]);

  useFrame((s, dt) => {
    const st = state.current;
    damp(st, "v", value / 100, 0.35, dt);
    st.pulse = Math.max(0, st.pulse - dt * 1.4);

    const segs = Math.max(1, Math.floor(TUBULAR * st.v));
    fillGeo.setDrawRange(0, segs * RADIAL * 6);

    const a = START - ARC * st.v;
    tip.current?.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    halo.current?.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    const pulse = 1 + st.pulse * 1.1;
    tip.current?.scale.setScalar(pulse);
    if (halo.current) {
      halo.current.scale.setScalar(1.8 * pulse);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + st.pulse * 0.45;
    }
    if (fill.current) (fill.current.material as THREE.MeshBasicMaterial).color.setScalar(1.5 + st.pulse * 1.2);

    const t = s.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.5) * 0.3;
      group.current.rotation.x = Math.sin(t * 0.37) * 0.12;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={track}>
        <meshBasicMaterial color="#6d5fb0" transparent opacity={0.28} />
      </mesh>
      <mesh ref={fill} geometry={fillGeo}>
        <meshBasicMaterial vertexColors toneMapped={false} color={new THREE.Color(1.5, 1.5, 1.5)} />
      </mesh>
      <mesh ref={tip}>
        <sphereGeometry args={[TUBE * 1.35, 24, 24]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[TUBE * 1.35, 20, 20]} />
        <meshBasicMaterial color="#f0abfc" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
