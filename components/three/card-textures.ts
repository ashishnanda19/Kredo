import * as THREE from "three";
import { BRAND } from "@/lib/config";

/**
 * Card art is drawn to small canvases at runtime (1024x646) and used as textures,
 * so there are no image assets to download. Everything is deliberately cheap.
 */

export const CARD_W = 3.4;
export const CARD_H = CARD_W / 1.586;

const W = 1024;
const H = 646;
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

function canvas(w = W, h = H) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function finish(c: HTMLCanvasElement, anisotropy = 4) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function makeFrontTexture(name: string, number: string) {
  const c = canvas();
  const g = c.getContext("2d")!;

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#7c3aed");
  bg.addColorStop(0.55, "#a21caf");
  bg.addColorStop(1, "#e11d8f");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  const r1 = g.createRadialGradient(840, 60, 0, 840, 60, 380);
  r1.addColorStop(0, "rgba(255,255,255,0.28)");
  r1.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r1;
  g.fillRect(0, 0, W, H);
  const r2 = g.createRadialGradient(80, 640, 0, 80, 640, 420);
  r2.addColorStop(0, "rgba(56,189,248,0.45)");
  r2.addColorStop(1, "rgba(56,189,248,0)");
  g.fillStyle = r2;
  g.fillRect(0, 0, W, H);

  // wordmark + K mark
  const mark = g.createLinearGradient(56, 52, 120, 116);
  mark.addColorStop(0, "#8b5cf6");
  mark.addColorStop(1, "#4338ca");
  g.fillStyle = mark;
  rr(g, 56, 52, 68, 68, 20);
  g.fill();
  g.strokeStyle = "#fff";
  g.lineWidth = 8;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(80, 70);
  g.lineTo(80, 104);
  g.moveTo(104, 68);
  g.lineTo(88, 86);
  g.lineTo(106, 104);
  g.stroke();
  g.fillStyle = "#fff";
  g.font = `800 48px ${FONT}`;
  g.textBaseline = "middle";
  g.fillText(BRAND.name, 140, 88);

  // contactless
  g.strokeStyle = "rgba(255,255,255,0.85)";
  g.lineWidth = 7;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.arc(900, 90, 18 + i * 17, -0.9, 0.9);
    g.stroke();
  }

  // chip
  const chip = g.createLinearGradient(56, 250, 170, 336);
  chip.addColorStop(0, "#fde68a");
  chip.addColorStop(1, "#f59e0b");
  g.fillStyle = chip;
  rr(g, 56, 250, 116, 88, 14);
  g.fill();
  g.strokeStyle = "rgba(120,53,15,0.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(56, 294);
  g.lineTo(172, 294);
  g.moveTo(114, 250);
  g.lineTo(114, 338);
  g.stroke();

  // number + name
  g.fillStyle = "#fff";
  g.font = `600 56px ui-monospace, 'SF Mono', Menlo, monospace`;
  g.fillText(number.split("").join(" "), 56, 440);
  g.font = `700 34px ${FONT}`;
  g.fillText(name.toUpperCase(), 56, 560);

  // "only works inside this app"
  const label = "Only works inside this app";
  g.font = `700 24px ${FONT}`;
  const tw = g.measureText(label).width;
  g.fillStyle = "rgba(0,0,0,0.38)";
  rr(g, W - 56 - tw - 44, 530, tw + 44, 54, 27);
  g.fill();
  g.fillStyle = "#fff";
  g.fillText(label, W - 56 - tw - 22, 558);

  // diagonal sheen
  const sheen = g.createLinearGradient(0, 0, W, H);
  sheen.addColorStop(0.35, "rgba(255,255,255,0)");
  sheen.addColorStop(0.46, "rgba(255,255,255,0.16)");
  sheen.addColorStop(0.58, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, W, H);

  return finish(c);
}

export function makeBackTexture() {
  const c = canvas();
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1b1038");
  bg.addColorStop(1, "#2e1457");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  const glow = g.createRadialGradient(W - 100, H - 60, 0, W - 100, H - 60, 380);
  glow.addColorStop(0, "rgba(225,29,143,0.35)");
  glow.addColorStop(1, "rgba(225,29,143,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  // magnetic strip
  g.fillStyle = "#05030c";
  g.fillRect(0, 70, W, 120);

  // signature panel
  g.fillStyle = "#e9d5ff";
  rr(g, 56, 250, 640, 84, 10);
  g.fill();
  g.strokeStyle = "rgba(124,58,237,0.5)";
  g.lineWidth = 3;
  for (let x = 70; x < 690; x += 22) {
    g.beginPath();
    g.moveTo(x, 256);
    g.lineTo(x - 14, 328);
    g.stroke();
  }

  g.fillStyle = "#fff";
  g.textBaseline = "middle";
  g.font = `700 40px ${FONT}`;
  g.fillText("Works only inside this app", 56, 440);
  g.fillStyle = "rgba(255,255,255,0.72)";
  g.font = `500 26px ${FONT}`;
  g.fillText(`${BRAND.name} virtual card. Demo preview, no real money.`, 56, 500);

  return finish(c);
}

export function makeBadgeTexture() {
  const c = canvas(256, 256);
  const g = c.getContext("2d")!;
  g.fillStyle = "#4ade80";
  g.beginPath();
  g.arc(128, 128, 116, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#052e16";
  g.lineWidth = 22;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(76, 134);
  g.lineTo(114, 170);
  g.lineTo(184, 92);
  g.stroke();
  return finish(c, 2);
}

/** Rounded-rect outline as a THREE.Shape (centred on the origin). */
export function roundedRectShape(w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Flat rounded-rect face whose UVs span 0..1 so a card texture maps edge to edge. */
export function roundedFaceGeometry(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(roundedRectShape(w, h, r), 10);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  return g;
}
