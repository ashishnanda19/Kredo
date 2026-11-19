"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { useGsapScene } from "./use-gsap-scene";

type Beam = { x: number; y: number; dx: number; dy: number; turns: number[]; n: number; wait: number; speed: number };

/** How long a beam's fading tail is, in px (it stretches with scroll speed). */
const TRAIL = 190;
/** Backing-store budget per canvas, in device pixels: tall fields on dense screens render a little softer instead of heavier. */
const MAX_PIXELS = 3_200_000;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (v: number) => 1 - (1 - v) * (1 - v) * (1 - v);

/** Small deterministic generator, so every field plays the same way on every visit. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Any CSS colour as "r, g, b", read back through a 1px canvas so tokens in any notation work. */
function toRgb(css: string): string {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return "0, 0, 0";
  x.fillStyle = css;
  x.fillRect(0, 0, 1, 1);
  const [r, g, b] = x.getImageData(0, 0, 1, 1).data;
  return `${r}, ${g}, ${b}`;
}

// cells are keyed by column and (unbounded) row packed into one number
const key = (i: number, j: number) => (j + 100000) * 128 + (i + 8);
const keyI = (k: number) => (k % 128) - 8;
const keyJ = (k: number) => Math.floor(k / 128) - 100000;

/**
 * The living grid: a hairline grid drawn on a canvas behind a section.
 *
 * - The lines draw themselves in from the centre when the field scrolls into view, and a ring of cells ripples outward.
 * - Signals travel along the lines (a fading tail and an accent spark), turning at junctions like traffic on a circuit.
 * - It listens to the scroll: the faster the page moves, the faster the signals run and the more cells flicker.
 * - The grid sits a little "deeper" than the page (it scrolls slightly slower), and the cell under a mouse lights up.
 *
 * Decorative only. It takes its line colour from the element's text colour and its spark from --accent, so it follows
 * the theme with no colours of its own. It only runs (and only holds memory) while on screen, on the one shared GSAP
 * ticker. Under reduced motion it is a still grid. Size and fade it with `className` (a mask-image works well).
 *
 * `curtain` is for a field inside the page's last block when that block is pinned behind the page and uncovered by the
 * scroll (the footer): it is in the viewport all along, so it wakes by distance to the end of the page instead.
 */
export function GridField({ className, beams = 5, seed = 1, curtain = false }: { className?: string; beams?: number; seed?: number; curtain?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    registerGsap();

    const rand = rng(seed * 9973 + 11);
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const S = { w: 0, h: 0, dpr: 1, cell: 64, ox: 0, top: 0, left: 0, shift: 0, reveal: reduce ? 1 : 0, energy: 0, lastY: window.scrollY, visible: false, active: 0, mx: 0, my: 0, lens: 0, moved: 9 };
    const cool = new Map<number, number>(); // cells lit in the line colour (signals, scroll flicker)
    const hot = new Map<number, number>(); // cells lit in the accent (pointer)
    let ink = "0, 0, 0";
    let accent = "0, 0, 0";
    let tween: gsap.core.Tween | undefined;

    const readColours = () => {
      const cs = getComputedStyle(canvas);
      ink = toRgb(cs.color);
      accent = toRgb(cs.getPropertyValue("--accent").trim() || cs.color);
    };

    const list: Beam[] = Array.from({ length: reduce ? 0 : beams }, (_, i) => ({ x: 0, y: 0, dx: 1, dy: 0, turns: [], n: 0, wait: 0.2 + i * 0.45 + rand() * 0.8, speed: 200 }));

    const spawn = (b: Beam) => {
      const c = S.cell;
      if (rand() < 0.5) {
        const j = Math.ceil(-S.shift / c) + Math.floor(rand() * Math.max(1, Math.floor(S.h / c)));
        const fromLeft = rand() < 0.5;
        b.y = j * c;
        b.x = fromLeft ? -S.ox - 8 : S.w - S.ox + 8;
        b.dx = fromLeft ? 1 : -1;
        b.dy = 0;
      } else {
        const i = Math.floor(rand() * (Math.floor((S.w - S.ox) / c) + 1));
        const fromTop = rand() < 0.6;
        b.x = i * c;
        b.y = fromTop ? -S.shift - 8 : S.h - S.shift + 8;
        b.dx = 0;
        b.dy = fromTop ? 1 : -1;
      }
      b.turns = [b.x, b.y];
      b.n = 0;
      b.speed = 150 + rand() * 170;
    };

    const step = (dt: number) => {
      const { w, h, cell: c, ox, shift: T, energy } = S;
      for (const [k, v] of cool) {
        if (v - dt * 1.5 <= 0) cool.delete(k);
        else cool.set(k, v - dt * 1.5);
      }
      for (const [k, v] of hot) {
        if (v - dt * 1.2 <= 0) hot.delete(k);
        else hot.set(k, v - dt * 1.2);
      }
      if (S.reveal < 0.6) return;

      // scroll flicker: the faster the page moves, the more cells light for a moment
      if (energy > 0.04) {
        const cols = Math.ceil(w / c);
        const rows = Math.ceil(h / c);
        const expect = energy * 2.2 * dt * 60;
        const count = Math.floor(expect) + (rand() < expect % 1 ? 1 : 0);
        for (let n = 0; n < count; n++) {
          const k = key(Math.floor(rand() * cols) - 1, Math.ceil(-T / c) - 1 + Math.floor(rand() * (rows + 1)));
          cool.set(k, Math.max(cool.get(k) ?? 0, 0.35 + rand() * 0.65));
        }
      }

      for (let n = 0; n < S.active; n++) {
        const b = list[n];
        if (b.wait > 0) {
          b.wait -= dt * (1 + energy * 3);
          if (b.wait <= 0) spawn(b);
          continue;
        }
        let rem = b.speed * (1 + energy * 2.2) * dt;
        while (rem > 0) {
          const horiz = b.dx !== 0;
          const pos = horiz ? b.x : b.y;
          const dir = horiz ? b.dx : b.dy;
          const next = dir > 0 ? (Math.floor(pos / c + 1e-4) + 1) * c : (Math.ceil(pos / c - 1e-4) - 1) * c;
          const gap = Math.abs(next - pos);
          if (rem < gap) {
            if (horiz) b.x += dir * rem;
            else b.y += dir * rem;
            break;
          }
          if (horiz) b.x = next;
          else b.y = next;
          rem -= gap;
          // at a junction that is on screen: sometimes light a neighbouring cell, sometimes turn
          const sx = ox + b.x;
          const sy = T + b.y;
          if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
          if (rand() < 0.16) cool.set(key(Math.round(b.x / c) - (rand() < 0.5 ? 1 : 0), Math.round(b.y / c) - (rand() < 0.5 ? 1 : 0)), 1);
          if (b.n < 10 && rand() < 0.22) {
            b.turns.unshift(b.x, b.y);
            const s = rand() < 0.5 ? 1 : -1;
            b.dx = horiz ? 0 : s;
            b.dy = horiz ? s : 0;
            b.n++;
          }
        }
        const sx = ox + b.x;
        const sy = T + b.y;
        const m = TRAIL * 2.4;
        if (sx < -m || sx > w + m || sy < -m || sy > h + m) b.wait = 0.5 + rand() * 2.8;
      }
    };

    const draw = () => {
      const { w, h, cell: c, ox, dpr, shift: T, reveal: r, energy } = S;
      if (!w || !h) return;
      const px = (v: number) => (Math.round(v * dpr) + 0.5) / dpr; // snap a hairline to the device pixel grid
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const j0 = Math.ceil(-T / c);
      const y0 = j0 * c + T;

      // lines: verticals fall from the top, centre first; horizontals open outward from the centre line
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${ink}, ${0.08 + energy * 0.05})`;
      ctx.beginPath();
      for (let x = ox; x <= w; x += c) {
        const p = r >= 1 ? 1 : easeOut(clamp01(r * 1.6 - (Math.abs(x - w / 2) / (w / 2)) * 0.6));
        if (p <= 0) continue;
        ctx.moveTo(px(x), 0);
        ctx.lineTo(px(x), h * p);
      }
      for (let y = y0; y <= h; y += c) {
        const p = r >= 1 ? 1 : easeOut(clamp01(r * 1.6 - (y / h) * 0.6));
        if (p <= 0) continue;
        ctx.moveTo(w / 2 - (w / 2) * p, px(y));
        ctx.lineTo(w / 2 + (w / 2) * p, px(y));
      }
      ctx.stroke();

      // under a mouse the lines brighten, like a torch held to the grid
      if (S.lens > 0.01) {
        const R = 190;
        const torch = ctx.createRadialGradient(S.mx, S.my, 0, S.mx, S.my, R);
        torch.addColorStop(0, `rgba(${ink}, ${0.3 * S.lens})`);
        torch.addColorStop(1, `rgba(${ink}, 0)`);
        ctx.strokeStyle = torch;
        ctx.beginPath();
        for (let x = ox + Math.ceil((S.mx - R - ox) / c) * c; x <= S.mx + R; x += c) {
          ctx.moveTo(px(x), S.my - R);
          ctx.lineTo(px(x), S.my + R);
        }
        for (let y = y0 + Math.ceil((S.my - R - y0) / c) * c; y <= S.my + R; y += c) {
          ctx.moveTo(S.mx - R, px(y));
          ctx.lineTo(S.mx + R, px(y));
        }
        ctx.stroke();
      }

      // entrance ripple: one ring of cells travels outward from the top centre while the lines draw
      ctx.fillStyle = `rgb(${ink})`;
      if (r > 0 && r < 1) {
        const far = Math.hypot(w / 2, h);
        for (let x = ox - c; x < w; x += c) {
          for (let y = y0 - c; y < h; y += c) {
            const k = 1 - Math.abs(Math.hypot(x + c / 2 - w / 2, y + c / 2) / far - r * 1.15) / 0.1;
            if (k <= 0) continue;
            ctx.globalAlpha = k * 0.11 * (1 - r * r);
            ctx.fillRect(x + 1, y + 1, c - 1, c - 1);
          }
        }
      }

      // lit cells
      for (const [k, v] of cool) {
        const y = keyJ(k) * c + T;
        if (y > h || y < -c) continue;
        ctx.globalAlpha = v * 0.07;
        ctx.fillRect(ox + keyI(k) * c + 1, y + 1, c - 1, c - 1);
      }
      ctx.fillStyle = `rgb(${accent})`;
      for (const [k, v] of hot) {
        const y = keyJ(k) * c + T;
        if (y > h || y < -c) continue;
        ctx.globalAlpha = v * v * 0.5;
        ctx.fillRect(ox + keyI(k) * c + 1, y + 1, c - 1, c - 1);
      }

      // register marks on a sparse set of junctions
      const marks = clamp01(r * 2 - 1);
      if (marks > 0) {
        const centre = Math.floor(w / 2 / c);
        const arm = 3.5 * marks;
        ctx.globalAlpha = 0.3 * marks;
        ctx.strokeStyle = `rgb(${ink})`;
        ctx.beginPath();
        for (let i = 0, x = ox; x <= w; x += c, i++) {
          if ((((i - centre) % 4) + 4) % 4 !== 0) continue;
          for (let j = j0, y = y0; y <= h; y += c, j++) {
            if (((j % 3) + 3) % 3 !== 0) continue;
            ctx.moveTo(px(x) - arm, px(y));
            ctx.lineTo(px(x) + arm, px(y));
            ctx.moveTo(px(x), px(y) - arm);
            ctx.lineTo(px(x), px(y) + arm);
          }
        }
        ctx.stroke();
      }

      // signals
      const trail = TRAIL * (1 + energy * 1.2);
      const fade = (s: number) => 0.55 * (1 - s / trail) ** 2;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      for (let n = 0; n < S.active; n++) {
        const b = list[n];
        if (b.wait > 0) continue;
        let ax = b.x;
        let ay = b.y;
        let s = 0;
        ctx.globalAlpha = 1;
        for (let k = 0; k < b.turns.length && s < trail; k += 2) {
          const len = Math.hypot(b.turns[k] - ax, b.turns[k + 1] - ay);
          if (len < 0.01) continue;
          const use = Math.min(len, trail - s);
          const ex = ax + ((b.turns[k] - ax) * use) / len;
          const ey = ay + ((b.turns[k + 1] - ay) * use) / len;
          const g = ctx.createLinearGradient(ox + ax, T + ay, ox + ex, T + ey);
          g.addColorStop(0, `rgba(${ink}, ${fade(s)})`);
          g.addColorStop(1, `rgba(${ink}, ${fade(s + use)})`);
          ctx.strokeStyle = g;
          ctx.beginPath();
          ctx.moveTo(ox + ax, T + ay);
          ctx.lineTo(ox + ex, T + ey);
          ctx.stroke();
          s += use;
          ax = b.turns[k];
          ay = b.turns[k + 1];
        }
        const hx = ox + b.x;
        const hy = T + b.y;
        const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 16);
        halo.addColorStop(0, `rgba(${accent}, 0.7)`);
        halo.addColorStop(1, `rgba(${accent}, 0)`);
        ctx.fillStyle = halo;
        ctx.fillRect(hx - 16, hy - 16, 32, 32);
        ctx.fillStyle = `rgb(${accent})`;
        ctx.beginPath();
        ctx.arc(hx, hy, 2.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      S.top = rect.top;
      S.left = rect.left;
      S.shift = -rect.top * 0.12; // the grid scrolls a little slower than the page, so it reads as a layer behind it
      return rect;
    };

    const resize = () => {
      const rect = measure();
      if (!rect.width || !rect.height) return;
      S.w = rect.width;
      S.h = rect.height;
      S.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, Math.sqrt(MAX_PIXELS / (S.w * S.h))));
      S.cell = S.w < 640 ? 44 : S.w < 1100 ? 56 : 64;
      S.ox = (S.w / 2) % S.cell; // one line always runs down the centre
      S.active = Math.min(list.length, S.w < 640 ? Math.ceil(beams / 2) : beams); // phones: half the signals
      const bw = Math.round(S.w * S.dpr);
      const bh = Math.round(S.h * S.dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
    };

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs || 16.7, 50) / 1000;
      measure();
      const y = window.scrollY;
      const speed = Math.abs(y - S.lastY) / dt;
      S.lastY = y;
      S.energy += (Math.min(speed / 2800, 1) - S.energy) * Math.min(1, dt * 5);
      S.moved += dt;
      S.lens += ((S.moved < 1.6 && S.reveal >= 1 ? 1 : 0) - S.lens) * Math.min(1, dt * 6); // the torch fades once the mouse rests or leaves
      step(dt);
      draw();
    };

    const onMove = (e: PointerEvent) => {
      if (!S.visible || S.reveal < 1) return;
      const x = e.clientX - S.left;
      const y = e.clientY - S.top;
      if (x < 0 || y < 0 || x > S.w || y > S.h) return;
      S.mx = x;
      S.my = y;
      S.moved = 0;
      hot.set(key(Math.floor((x - S.ox) / S.cell), Math.floor((y - S.shift) / S.cell)), 1);
    };

    readColours();

    const show = () => {
      if (S.visible) return;
      S.visible = true;
      resize();
      S.lastY = window.scrollY;
      if (reduce) draw();
      else gsap.ticker.add(tick);
    };
    /** Off screen: hand the backing store back and, if the field will next be entered from above, re-arm its entrance. */
    const hide = (rearm: boolean) => {
      if (!S.visible) return;
      S.visible = false;
      gsap.ticker.remove(tick);
      canvas.width = canvas.height = 0;
      if (reduce || !rearm) return;
      tween?.kill();
      S.reveal = 0;
      S.lens = 0;
      cool.clear();
      hot.clear();
      list.forEach((b, i) => {
        b.wait = 0.2 + i * 0.45;
      });
    };
    const play = () => {
      if (reduce || S.reveal > 0) return;
      tween?.kill();
      tween = gsap.to(S, { reveal: 1, duration: 1.8, ease: "power2.out" });
    };

    let stopWatching: () => void;
    if (curtain) {
      let max = 0;
      const check = () => {
        const left = max - window.scrollY;
        const height = canvas.offsetHeight;
        if (left < height + 60) show();
        else hide(true);
        if (left < height * 0.72) play();
      };
      const limits = () => {
        max = document.documentElement.scrollHeight - window.innerHeight;
        check();
      };
      const body = new ResizeObserver(limits);
      body.observe(document.body);
      window.addEventListener("resize", limits);
      window.addEventListener("scroll", check, { passive: true });
      limits();
      stopWatching = () => {
        body.disconnect();
        window.removeEventListener("resize", limits);
        window.removeEventListener("scroll", check);
      };
    } else {
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) show();
          else hide(canvas.getBoundingClientRect().top > 0);
        },
        { rootMargin: "60px 0px" },
      );
      io.observe(canvas);
      const enter = new IntersectionObserver(([e]) => e.isIntersecting && play(), { rootMargin: "0px 0px -14% 0px" });
      enter.observe(canvas);
      stopWatching = () => {
        io.disconnect();
        enter.disconnect();
      };
    }

    const ro = new ResizeObserver(() => {
      if (!S.visible) return;
      resize();
      if (reduce) draw();
    });
    ro.observe(canvas);

    const theme = new MutationObserver(() => {
      readColours();
      if (reduce && S.visible) draw();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    if (fine && !reduce) window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      stopWatching();
      ro.disconnect();
      theme.disconnect();
      tween?.kill();
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduce, beams, seed, curtain]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 -z-10 h-full w-full text-ink", className)} />;
}

/** A cheap, stable 0..1 hash of a cell position. */
function hash(i: number, j: number, salt: number) {
  let h = Math.imul(i * 374761393 + j * 668265263 + salt * 2147483647, 1274126177);
  h ^= h >>> 13;
  h = Math.imul(h, 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * A mosaic seam between two colour blocks. Lay it over the top edge of the lower block and give it the upper block's
 * colour as its text colour: the upper colour then breaks into squares that dissolve, bottom row first, in step with the
 * scroll (and re-form on the way back up). A few squares catch the accent just before they go.
 * Draws nothing when both blocks are the same colour (the dark theme) or under reduced motion.
 */
export function MosaicSeam({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useGsapScene(ref, (root) => {
    const canvas = root as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let progress = 0;
    let fill = "0, 0, 0";
    let accent = "0, 0, 0";
    let same = false;

    const readColours = () => {
      const cs = getComputedStyle(canvas);
      fill = toRgb(cs.color);
      accent = toRgb(cs.getPropertyValue("--accent").trim() || cs.color);
      same = fill === toRgb(cs.getPropertyValue("--page").trim() || cs.color);
    };

    const draw = () => {
      if (!w || !h) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (same) return;
      const s = w < 640 ? 18 : 26;
      const cols = Math.ceil(w / s);
      const rows = Math.ceil(h / s);
      const x0 = (w - cols * s) / 2;
      // the cut line climbs from below the band to above it; each square goes when the cut passes its own threshold
      const cut = 1.12 - progress * 1.4;
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass ? `rgb(${accent})` : `rgb(${fill})`;
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const left = cut - (((j + 0.5) / rows) * 0.72 + hash(i, j, 1) * 0.28);
            if (left <= 0) continue;
            const spark = hash(i, j, 2) < 0.05 && left < 0.1 && j > 0;
            if (spark !== Boolean(pass)) continue;
            ctx.globalAlpha = clamp01(left / 0.05);
            ctx.fillRect(x0 + i * s, j * s, s + 0.5, s + 0.5);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      draw();
    };

    readColours();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const theme = new MutationObserver(() => {
      readColours();
      draw();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    ScrollTrigger.create({
      trigger: canvas,
      start: "top bottom",
      end: "bottom 30%",
      onUpdate: (self) => {
        progress = self.progress;
        draw();
      },
    });
    // gsap.context runs a returned function when the scene is reverted
    return () => {
      ro.disconnect();
      theme.disconnect();
    };
  });

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-full w-full", className)} />;
}

/**
 * A ruled line across the top of a section, on the content width: it opens outward from the centre as the section
 * scrolls in, an accent spark riding each end, and settles with a register mark at either edge. Reduced motion shows
 * the finished rule.
 */
export function GridRule({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGsapScene(ref, (root) => {
    const q = (s: string) => root.querySelectorAll(s);
    gsap
      .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top 94%", end: "top 56%", scrub: 0.6 } })
      .fromTo(q("[data-rule-line]"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      .fromTo(q("[data-rule-l]"), { xPercent: 50 }, { xPercent: 0, duration: 1 }, 0)
      .fromTo(q("[data-rule-r]"), { xPercent: -50 }, { xPercent: 0, duration: 1 }, 0)
      .fromTo(q("[data-rule-spark]"), { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0.02)
      .to(q("[data-rule-spark]"), { opacity: 0, scale: 0.4, duration: 0.14 }, 0.9)
      .fromTo(q("[data-rule-mark]"), { scale: 0, rotate: -90, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.2, ease: "power2.out" }, 0.86);
  });

  return (
    // clipped sideways: the spark carriers start half a rule's width off to the side, and must not widen the page while they wait
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-[1180px] px-4 [overflow-x:clip] sm:px-6", className)}>
      <div className="relative h-px">
        <span data-rule-line className="absolute inset-0 bg-ink/15" />
        <span data-rule-l className="absolute inset-0">
          <span data-rule-spark className="absolute -left-[3px] -top-[3px] size-[7px] rounded-full bg-accent shadow-[0_0_14px_3px_var(--accent)] motion-reduce:hidden" />
        </span>
        <span data-rule-r className="absolute inset-0">
          <span data-rule-spark className="absolute -right-[3px] -top-[3px] size-[7px] rounded-full bg-accent shadow-[0_0_14px_3px_var(--accent)] motion-reduce:hidden" />
        </span>
        <span data-rule-mark className="grid-plus absolute -left-[6px] -top-[6px] size-[13px] text-ink/50" />
        <span data-rule-mark className="grid-plus absolute -right-[6px] -top-[6px] size-[13px] text-ink/50" />
      </div>
    </div>
  );
}
