"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { colors, type Tier } from "@/lib/theme";
import { Coin, useCoinKit, type CoinLook } from "./coin-kit";
import { StudioEnv } from "./studio-env";

const FOV = 32;
const CAM_Z = 10;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

/** A coin's home: where it sits in the frame (u, v as fractions of it), how deep (z, towards the camera is +), and its radius. */
export type CoinSpec = { u: number; v: number; z: number; size: number; look: CoinLook };

/**
 * What the scroll does to the field.
 * - "leave": the coins rest, then fly out past the viewer between 0.27 and 0.57 of `progress`, and the canvas fades.
 * - "arrive": the coins fly in from outside the frame as `progress` runs 0 to 1, then rest.
 */
export type CoinMotion = "leave" | "arrive";

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOutBack = (t: number) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

function Field({ wide, narrow, progress, motion }: { wide: CoinSpec[]; narrow: CoinSpec[]; progress: () => number; motion: CoinMotion }) {
  const kit = useCoinKit();
  const size = useThree((s) => s.size);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const S = useRef({ t: 0, px: 0, py: 0, tx: 0, ty: 0, spin: 0, lastP: 0, shown: 1 });

  const small = size.width < 900;
  const specs = small ? narrow : wide;
  // coins shrink with the frame so they never crowd a small screen
  const k = THREE.MathUtils.clamp(size.width / 1150, 0.55, 1.1);
  const aspect = size.width / Math.max(1, size.height);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      S.current.tx = e.clientX / window.innerWidth - 0.5;
      S.current.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // priority 1: this callback owns the render, so nothing is drawn once the splash has been wiped away
  useFrame(({ gl, scene, camera }, raw) => {
    const s = S.current;
    const dt = Math.min(raw, 0.05);
    const p = progress();
    const shown = motion === "leave" ? 1 - clamp01((p - 0.5) / 0.14) : 1;
    if (shown !== s.shown) {
      s.shown = shown;
      gl.domElement.style.opacity = String(shown);
    }
    if (shown <= 0) return;

    s.t += dt;
    s.px += (s.tx - s.px) * (1 - Math.exp(-dt * 4));
    s.py += (s.ty - s.py) * (1 - Math.exp(-dt * 4));
    // scrolling spins the coins; the spin carries on a little after the scroll stops
    s.spin += (p - s.lastP) * 26;
    s.lastP = p;
    // how far out the coins are thrown, 0 (home) to 1 (past the viewer): outward from the centre and towards the camera
    const fly = motion === "leave" ? clamp01((p - 0.27) / 0.3) : 1 - clamp01(p);
    const e = fly * fly * fly;

    specs.forEach((c, i) => {
      const m = refs.current[i];
      if (!m) return;
      const h = 2 * (CAM_Z - c.z) * TAN;
      const hx = (c.u - 0.5) * h * aspect;
      const hy = (0.5 - c.v) * h;
      const len = Math.hypot(hx, hy) || 1;
      // nearer coins move more against the pointer, which is what reads as depth
      const par = 0.22 + (c.z + 6) * 0.085;
      const seed = i * 1.7;
      m.position.set(
        hx + Math.cos(s.t * 0.45 + seed) * 0.07 - s.px * par + (hx / len) * e * 9,
        hy + Math.sin(s.t * 0.6 + seed) * 0.13 + s.py * par * 0.7 + (hy / len) * e * 9,
        c.z + e * 5.5,
      );
      m.rotation.set(0.35 + Math.sin(s.t * 0.5 + seed) * 0.45, s.t * (0.35 + (i % 4) * 0.12) + seed + s.spin * (i % 2 ? -1 : 1), 0.3 * Math.cos(s.t * 0.4 + seed));
      const born = clamp01((s.t - 0.1 - i * 0.07) / 0.9);
      m.scale.setScalar(c.size * k * (1 + e * 0.5) * (born <= 0 ? 0.0001 : easeOutBack(born)));
    });
    gl.render(scene, camera);
  }, 1);

  return specs.map((c, i) => (
    <Coin
      key={`${small}-${i}`}
      kit={kit}
      look={c.look}
      ref={(n) => {
        refs.current[i] = n;
      }}
    />
  ));
}

/**
 * A field of Kredo coins hanging at different depths across a frame, in real 3D. They drift and tumble, shift against
 * the pointer by their depth (near ones more), spin with the scroll, and are thrown out past the viewer or gathered
 * back in as `progress` (0 to 1) runs, per `motion`. Decorative only; transparent to the pointer.
 *
 * Two lightings: on a coloured `stage` the coins reflect that colour and the far ones sink into a fog of it (tone on
 * tone, as on the yellow splash); without one they sit in the dark studio the other coins use, which gives the metal
 * its contrast on a plain page. Renders only while `active`.
 */
export default function CoinField({
  wide,
  narrow,
  progress,
  motion,
  stage,
  active,
  tier,
}: {
  wide: CoinSpec[];
  narrow: CoinSpec[];
  progress: () => number;
  motion: CoinMotion;
  stage?: string;
  active: boolean;
  tier: Tier;
}) {
  const fog = useMemo(() => (stage ? new THREE.Fog(stage, 9.5, 21) : null), [stage]);
  return (
    <Canvas
      flat={!!stage}
      frameloop={active ? "always" : "never"}
      dpr={tier === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.5, far: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      scene={{ fog }}
      style={{ pointerEvents: "none" }}
    >
      {stage ? (
        <>
          <ambientLight intensity={0.55} />
          <directionalLight position={[-4, 6, 8]} intensity={2.2} color={colors.page} />
          <directionalLight position={[6, -2, 4]} intensity={0.7} color={stage} />
          {/* the room the coins reflect: the stage itself, two soft white windows and one dark card for contrast */}
          <Environment resolution={64} frames={1} environmentIntensity={1}>
            <color attach="background" args={[stage]} />
            <Lightformer form="rect" color={colors.page} intensity={6} position={[-5, 4, 2]} rotation-y={Math.PI / 2} scale={[9, 3, 1]} />
            <Lightformer form="rect" color={colors.page} intensity={4} position={[0, 6, -2]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
            <Lightformer form="rect" color={colors.ink} intensity={1} position={[6, -1, 0]} rotation-y={-Math.PI / 2} scale={[8, 5, 1]} />
            <Lightformer form="ring" color={colors.page} intensity={2} position={[0, 0, 7]} scale={3} />
          </Environment>
        </>
      ) : (
        <StudioEnv tier="mid" />
      )}
      <Field wide={wide} narrow={narrow} progress={progress} motion={motion} />
    </Canvas>
  );
}
