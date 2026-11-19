"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Coin, useCoinKit, type CoinLook } from "@/components/three/coin-kit";
import { StudioEnv } from "@/components/three/studio-env";
import { colors, type Tier } from "@/lib/theme";

/** The canvas is a square this many phone widths across, centred on the phone. Keep in step with the box in scenes-stage.tsx. */
const ORBIT_SPAN = 3.2;

const FOV = 30;
const CAM_Z = 10;
/** World units across the canvas at the phone's depth (z = 0). */
const VIEW = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const PHONE_W = VIEW / ORBIT_SPAN;
const PHONE_H = PHONE_W * 2.14;

/** Two orbits crossing like an atom's: radius, tilt back from the screen, roll, speed (rad/s), and what rides them. */
const ORBITS = [
  {
    r: PHONE_W * 1.16,
    tilt: 1.2,
    roll: -0.3,
    speed: 0.24,
    riders: [
      { at: 0.2, size: 0.27, look: "gold" },
      { at: 1.9, size: 0.19, look: "ink" },
      { at: 3.4, size: 0.23, look: "gold" },
      { at: 4.9, size: 0.16, look: "gold" },
    ],
    beads: [1.05, 4.15],
  },
  {
    r: PHONE_W * 1.02,
    tilt: 1.08,
    roll: 0.42,
    speed: -0.34,
    riders: [
      { at: 0.9, size: 0.2, look: "gold" },
      { at: 2.9, size: 0.24, look: "ink" },
      { at: 5.0, size: 0.17, look: "gold" },
    ],
    beads: [3.95],
  },
] as const;

/** Where the whole system leans for each scene (radians, x y z). It eases from one to the next. */
const POSES: [number, number, number][] = [
  [0, 0, 0],
  [0.16, 0.5, -0.16],
  [-0.14, -0.42, 0.2],
  [0.2, 0.85, 0.08],
  [-0.06, -0.2, 0.34],
];

/** The page's ink colour (the --ink token on the root), re-read whenever the theme class changes. */
const readInk = () => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || colors.ink;
function watchTheme(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

const easeOutBack = (t: number) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

/** The phone's silhouette as a depth-only shape: it draws nothing, but hides whatever passes behind the DOM phone. */
function Occluder() {
  const geo = useMemo(() => {
    const w = PHONE_W - 0.02;
    const h = PHONE_H - 0.02;
    const r = PHONE_W * 0.16;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new THREE.ShapeGeometry(s, 10);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} renderOrder={-1}>
      <meshBasicMaterial colorWrite={false} />
    </mesh>
  );
}

function System({ idx, ink, onReady }: { idx: number; ink: string; onReady: () => void }) {
  const kit = useCoinKit();
  const root = useRef<THREE.Group>(null);
  const coins = useRef<(THREE.Group | null)[]>([]);
  const beads = useRef<(THREE.Mesh | null)[]>([]);
  const S = useRef({ t: 0, travel: 0, boost: 0, lastY: 0, idx, px: 0, py: 0, ready: false });

  // flat lists of everything that rides an orbit, each with its orbit's frame
  const { riders, beadList, frames } = useMemo(() => {
    // an orbit runs in the XZ plane (edge-on to the camera); lift its far side by the complement of the tilt, then roll it
    const frames = ORBITS.map((o) => new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 - o.tilt, 0, o.roll, "ZXY")));
    const riders = ORBITS.flatMap((o, k) => o.riders.map((c, n) => ({ ...c, k, seed: k * 7 + n * 3 })));
    const beadList = ORBITS.flatMap((o, k) => o.beads.map((at) => ({ at, k })));
    return { riders, beadList, frames };
  }, []);

  useEffect(() => {
    S.current.lastY = window.scrollY;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    const onMove = (e: PointerEvent) => {
      S.current.px = e.clientX / window.innerWidth - 0.5;
      S.current.py = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, raw) => {
    const s = S.current;
    const dt = Math.min(raw, 0.05);
    s.t += dt;
    // a scene change kicks the whole system round, in the direction of travel
    if (idx !== s.idx) {
      s.boost += (idx > s.idx ? 1 : -1) * 2.6;
      s.idx = idx;
    }
    s.boost *= Math.exp(-dt * 2.4);
    // the scroll itself winds the orbits, so the coins travel while the page moves and drift when it rests
    const y = window.scrollY;
    const dy = THREE.MathUtils.clamp(y - s.lastY, -160, 160);
    s.lastY = y;
    s.travel += dy * 0.0022 + s.boost * dt;

    const g = root.current;
    if (g) {
      const [ax, ay, az] = POSES[Math.min(POSES.length - 1, idx)];
      const k = 1 - Math.exp(-dt * 3.2);
      g.rotation.x += (ax + s.py * 0.16 - g.rotation.x) * k;
      g.rotation.y += (ay + s.px * 0.3 - g.rotation.y) * k;
      g.rotation.z += (az - g.rotation.z) * k;
    }

    riders.forEach((c, i) => {
      const o = ORBITS[c.k];
      const m = coins.current[i];
      if (!m) return;
      const a = c.at + s.t * o.speed + s.travel * Math.sign(o.speed);
      v.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r).applyQuaternion(frames[c.k]);
      m.position.copy(v);
      // each coin turns on its own axis like a spun coin, and nods a little
      m.rotation.set(Math.sin(s.t * 0.7 + c.seed) * 0.35, s.t * (0.9 + (c.seed % 4) * 0.22) + s.travel * 1.6 + c.seed, 0.25 * Math.cos(s.t * 0.5 + c.seed));
      // they pop in one after another when the scene first draws
      const born = THREE.MathUtils.clamp((s.t - 0.15 - i * 0.09) / 0.8, 0, 1);
      m.scale.setScalar(c.size * (born <= 0 ? 0.0001 : easeOutBack(born)));
    });
    beadList.forEach((b, i) => {
      const o = ORBITS[b.k];
      const m = beads.current[i];
      if (!m) return;
      const a = b.at + s.t * o.speed + s.travel * Math.sign(o.speed);
      m.position.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r).applyQuaternion(frames[b.k]);
    });

    if (!s.ready && s.t > 0.1) {
      s.ready = true;
      onReady();
    }
  });

  return (
    <>
      <Occluder />
      {/* centred a little below the middle of the phone, so the near side of each orbit crosses its foot, not the middle of the screen */}
      <group ref={root} position-y={-PHONE_W * 0.3}>
        {ORBITS.map((o, k) => (
          <group key={k} quaternion={frames[k]}>
            {/* a torus lies in XY and the orbit runs in XZ, so lay it down first */}
            <mesh rotation-x={Math.PI / 2}>
              <torusGeometry args={[o.r, 0.007, 6, 160]} />
              <meshBasicMaterial color={ink} transparent opacity={0.16} />
            </mesh>
          </group>
        ))}
        {riders.map((c, i) => (
          <Coin
            key={i}
            kit={kit}
            look={c.look as CoinLook}
            ref={(n) => {
              coins.current[i] = n;
            }}
          />
        ))}
        {beadList.map((_, i) => (
          <mesh
            key={i}
            ref={(n) => {
              beads.current[i] = n;
            }}
          >
            <sphereGeometry args={[0.062, 20, 20]} />
            <meshStandardMaterial color={ink} metalness={0.4} roughness={0.35} />
          </mesh>
        ))}
      </group>
    </>
  );
}

/**
 * The scene-by-scene stage in real 3D: Kredo coins ride two crossing orbits around the phone, passing behind it and
 * in front of it. The phone itself is still DOM; an invisible depth shape with its exact silhouette does the hiding.
 * Scrolling winds the orbits, every scene change swings the whole system to a new lean, and a mouse tilts it.
 * Decorative only. It renders only while `active` (the stage is on screen).
 */
export default function OrbitScene({ idx, active, tier, onReady }: { idx: number; active: boolean; tier: Tier; onReady: () => void }) {
  // the orbit lines and beads take the page's ink, so they follow the light and dark themes like the flat orbit did
  const ink = useSyncExternalStore(watchTheme, readInk, () => colors.ink);
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={tier === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 1, far: 30 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <StudioEnv tier="mid" />
      <System idx={idx} ink={ink} onReady={onReady} />
    </Canvas>
  );
}
