"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, CheckCircle2, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { CssCard } from "@/components/three/css-card-fallback";
import { COPY } from "@/lib/copy";
import { student } from "@/lib/mock-data";
import { rigReady } from "./scenes/card-rig";

const chips = [
  { icon: CheckCircle2, text: COPY.hero.chips[0], tone: "text-success", pos: "left-0 top-0 sm:-left-8 sm:-top-1", delay: 0 },
  { icon: TrendingUp, text: COPY.hero.chips[1], tone: "text-neon-blue", pos: "hidden sm:block sm:-right-6 sm:-top-2", delay: 0.8 },
  { icon: BadgeCheck, text: COPY.hero.chips[2], tone: "text-neon-magenta", pos: "bottom-0 right-0 sm:-bottom-3 sm:-right-10", delay: 1.4 },
];

/**
 * Right-hand side of the hero: the card (CSS version here; the WebGL card replaces it on capable devices)
 * plus floating glass notification chips that drift around it.
 */
export function HeroVisual() {
  // once the scroll-driven card has drawn its first frame, the inline poster fades out
  const live = useSyncExternalStore(rigReady.subscribe, rigReady.get, () => false);
  return (
    <div id="hero-visual" className="relative order-first mx-auto w-full max-w-[340px] px-3 py-12 sm:max-w-[460px] sm:px-0 sm:py-14 lg:order-none">
      <div aria-hidden className="absolute inset-6 -z-10 rounded-full bg-neon-violet/30 blur-3xl" />

      <div data-hero-card-slot role="img" aria-label={COPY.hero.cardAlt} className="relative touch-pan-y">
        {/* same pose as the scroll-driven card at scroll 0, so the hand-over is seamless */}
        <div
          className={live ? "opacity-0 transition-opacity duration-500" : "transition-opacity duration-500"}
          style={{ transform: "perspective(1200px) rotateZ(-0.1rad) rotateX(-0.1rad) rotateY(-0.35rad) scale(0.96)" }}
        >
          <CssCard name={student.name} number="•••• •••• •••• 0042" tilt={false} />
        </div>
      </div>

      {chips.map((c) => (
        <motion.div
          key={c.text}
          className={`absolute ${c.pos}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { delay: 0.9 + c.delay * 0.4, duration: 0.5 },
            scale: { delay: 0.9 + c.delay * 0.4, type: "spring", stiffness: 260, damping: 18 },
            y: { duration: 5 + c.delay, repeat: Infinity, ease: "easeInOut", delay: c.delay },
          }}
        >
          <GlassCard strength="strong" radius="md" className="flex items-center gap-2.5 px-3.5 py-2.5">
            <c.icon className={`size-5 ${c.tone}`} aria-hidden />
            <span className="whitespace-nowrap text-[13px] font-bold">{c.text}</span>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
