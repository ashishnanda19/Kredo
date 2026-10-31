"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { CardFaces } from "./card-faces";

interface CssCardProps {
  name: string;
  number: string;
  /** show the back face */
  flipped?: boolean;
  /** replaces the default back-face content (strip + "Works only inside this app") */
  back?: React.ReactNode;
  /** pointer tilt (desktop) */
  tilt?: boolean;
  className?: string;
}

/**
 * CSS-3D virtual card. This is the low-power fallback for the WebGL card, and the poster
 * shown while the 3D bundle loads. Same design language: violet-to-magenta iridescent glass.
 */
export function CssCard({ name, number, flipped = false, back, tilt = true, className }: CssCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), { stiffness: 140, damping: 16 });

  const onMove = (e: React.PointerEvent) => {
    if (!tilt || e.pointerType === "touch") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("relative aspect-[1.586/1] w-full [perspective:1100px]", className)}
    >
      <motion.div className="absolute inset-0 [transform-style:preserve-3d]" style={{ rotateX: rx, rotateY: ry }}>
        <motion.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <CardFaces name={name} number={number} back={back} frontHidden={flipped} backHidden={!flipped} />
        </motion.div>
      </motion.div>
    </div>
  );
}
