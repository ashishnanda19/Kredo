"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Eye, EyeOff, RotateCw, ScanLine } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { CssCard } from "@/components/three/css-card-fallback";
import type { CardInput } from "@/components/three/card-canvas";
import { COPY } from "@/lib/copy";
import { kredoCard, student } from "@/lib/mock-data";
import { useGlTier } from "@/lib/quality";

const CardCanvas = dynamic(() => import("@/components/three/card-canvas"), { ssr: false });

let webgl: boolean | null = null;
function supportsWebGL() {
  if (webgl === null) {
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/**
 * Dashboard virtual card. Mid/high tier: a small WebGL canvas (cursor tilt, touch drag to rotate,
 * tap to flip). Low tier / no WebGL: the CSS 3D card with the same flip. Card details (show/hide)
 * live in a glass panel that slides in under the card when it is flipped.
 */
export function VirtualCard() {
  const gl = useGlTier();
  const tier = gl === "pending" ? "low" : gl;
  const [flipped, setFlipped] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { margin: "120px" });
  const input = useRef<CardInput>({ flipped: false, px: 0, py: 0, dragY: 0 });
  const drag = useRef({ active: false, startX: 0, base: 0, moved: false });

  const useGl = gl !== "pending" && tier !== "low" && typeof window !== "undefined" && supportsWebGL();

  function flip() {
    setFlipped((f) => {
      input.current.flipped = !f;
      return !f;
    });
    setReveal(false);
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    if (e.pointerType === "mouse") {
      input.current.px = ((e.clientX - r.left) / r.width) * 2 - 1;
      input.current.py = ((e.clientY - r.top) / r.height) * 2 - 1;
    } else if (drag.current.active) {
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) > 6) drag.current.moved = true;
      input.current.dragY = Math.max(-1.2, Math.min(1.2, drag.current.base + dx * 0.012));
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    drag.current = { active: true, startX: e.clientX, base: input.current.dragY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    const wasDrag = drag.current.moved;
    drag.current.active = false;
    input.current.dragY = 0; // spring back (damped in the render loop)
    if (!wasDrag) flip();
  };
  const onPointerLeave = () => {
    input.current.px = 0;
    input.current.py = 0;
  };

  const d = COPY.dashboard;

  return (
    <section aria-label="Virtual card" className="flex h-full flex-col justify-between gap-4">
      <div
        ref={stage}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        onClick={(e) => {
          // mouse click flips (touch flips on pointerup so a drag is not a tap)
          if ((e.nativeEvent as PointerEvent).pointerType === "mouse") flip();
        }}
        className="relative aspect-[1.586/1] w-full cursor-pointer touch-pan-y select-none"
      >
        {/* CSS card: the poster until WebGL draws its first frame, and the low-power version */}
        <div className={useGl && glReady ? "opacity-0" : undefined} aria-hidden={useGl && glReady}>
          <CssCard name={student.name} number={kredoCard.masked} flipped={flipped} tilt={!useGl} />
        </div>
        {useGl && (
          <div aria-hidden className="pointer-events-none absolute -inset-[7%]">
            <CardCanvas tier={tier} active={inView} input={input} name={student.name} number={kredoCard.masked} onFirstFrame={() => setGlReady(true)} />
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {flipped && (
          <motion.div
            key="details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard radius="md" className="p-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Number</dt>
                  <dd className="font-mono tabular-nums">{reveal ? kredoCard.number : kredoCard.masked}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Expiry</dt>
                  <dd className="font-mono">{reveal ? kredoCard.expiry : "••/••"}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">CVV</dt>
                  <dd className="font-mono">{reveal ? kredoCard.cvv : "•••"}</dd>
                </div>
              </dl>
              <GlassButton variant="outline" size="sm" onClick={() => setReveal((r) => !r)} aria-pressed={reveal} className="mt-3">
                {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                {reveal ? d.flip.hide : d.flip.show}
              </GlassButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <GlassButton asChild size="lg" className="flex-1">
          <Link href="/dashboard/pay">
            <ScanLine className="size-5" aria-hidden /> {d.pay}
          </Link>
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="icon"
          className="size-14"
          aria-label={flipped ? d.flip.front : d.flip.back}
          aria-pressed={flipped}
          onClick={flip}
        >
          <RotateCw className="size-5" />
        </GlassButton>
      </div>
    </section>
  );
}
