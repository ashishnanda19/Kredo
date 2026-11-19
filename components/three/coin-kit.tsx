"use client";

import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { colors } from "@/lib/theme";

/** Coin proportions in its own units: radius 1, with a fully rounded edge of this thickness. */
const THICK = 0.2;

export type CoinLook = "gold" | "ink";

/**
 * A coin face painted on a canvas: the Kredo glyph (the same shapes as components/shared/logo.tsx) inside a fine
 * rim line. The cap's UVs map the square's inscribed circle, so the corners never show.
 */
function faceTexture(bg: string, fg: string, size = 320) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    // rim line and a soft inner well, so the face reads as struck metal
    ctx.strokeStyle = fg;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = size * 0.012;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.39, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // the glyph, centred: its box in icon space is about 306..776 by 229..850
    const s = (size * 0.46) / 621;
    ctx.translate(size / 2, size / 2);
    ctx.scale(s, s);
    ctx.translate(-541, -540);
    ctx.fillStyle = ctx.strokeStyle = fg;
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.arc(712, 293, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 130;
    ctx.stroke(new Path2D("M371 355V785"));
    ctx.stroke(new Path2D("M605 396 440 560 620 752"));
    ctx.lineWidth = 40;
    const tri = new Path2D("M371 400 500 570 371 740Z");
    ctx.fill(tri);
    ctx.stroke(tri);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export interface CoinKit {
  body: THREE.CylinderGeometry;
  edge: THREE.TorusGeometry;
  /** [side, front, back] for the body, and the edge material, per look */
  mats: Record<CoinLook, { body: THREE.Material[]; edge: THREE.Material }>;
}

/**
 * Geometry and materials for the Kredo coin, shared by every coin in a scene and freed when the scene unmounts.
 * Two looks from the brand's own two colours: "gold" (accent metal, ink glyph) and "ink" (graphite, accent glyph).
 */
export function useCoinKit(): CoinKit {
  const kit = useMemo<CoinKit>(() => {
    const r = 1 - THICK / 2;
    // the cylinder carries the two faces; the torus wraps its rim into a round, polished edge
    const body = new THREE.CylinderGeometry(r, r, THICK, 56, 1);
    body.rotateX(Math.PI / 2);
    // the cap's UVs start a quarter turn round; turn the faces so the glyph stands upright
    body.rotateZ(Math.PI / 2);
    const edge = new THREE.TorusGeometry(r, THICK / 2, 18, 72);
    const make = (metal: string, glyph: string, rough: number) => {
      const tex = faceTexture(metal, glyph);
      const side = new THREE.MeshStandardMaterial({ color: metal, metalness: 1, roughness: rough });
      const face = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.72, roughness: rough + 0.1 });
      // the far cap's UVs come out upside down; turn its copy of the face half a turn so the glyph reads from behind too
      const flipped = tex.clone();
      flipped.repeat.set(-1, -1);
      flipped.offset.set(1, 1);
      flipped.needsUpdate = true;
      const back = face.clone();
      back.map = flipped;
      return { body: [side, face, back], edge: side };
    };
    return { body, edge, mats: { gold: make(colors.accent, colors.ink, 0.2), ink: make(colors.ink, colors.accent, 0.3) } };
  }, []);

  useEffect(
    () => () => {
      kit.body.dispose();
      kit.edge.dispose();
      for (const look of Object.values(kit.mats)) {
        for (const m of new Set([...look.body, look.edge])) {
          (m as THREE.MeshStandardMaterial).map?.dispose();
          m.dispose();
        }
      }
    },
    [kit],
  );
  return kit;
}

/** One coin: radius 1 in its own space, faces along Z. Scale and place the group. */
export const Coin = forwardRef<THREE.Group, { kit: CoinKit; look?: CoinLook }>(function Coin({ kit, look = "gold" }, ref) {
  const m = kit.mats[look];
  return (
    <group ref={ref} dispose={null}>
      <mesh geometry={kit.body} material={m.body} />
      <mesh geometry={kit.edge} material={m.edge} />
    </group>
  );
});
