"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, RotateCw, ScanLine } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { CssCard } from "@/components/three/css-card-fallback";
import { COPY } from "@/lib/copy";
import { kredoCard, student } from "@/lib/mock-data";

/**
 * Dashboard virtual card: the CSS card (pointer tilt, tap or click to flip). Card details (show/hide)
 * slide in under the card when it is flipped.
 */
export function VirtualCard() {
  const [flipped, setFlipped] = useState(false);
  const [reveal, setReveal] = useState(false);

  function flip() {
    setFlipped((f) => !f);
    setReveal(false);
  }

  const d = COPY.dashboard;

  return (
    <section aria-label="Virtual card" className="flex h-full flex-col justify-between gap-4">
      <div onClick={flip} aria-hidden className="relative aspect-[1.586/1] w-full cursor-pointer select-none">
        <CssCard name={student.name} number={kredoCard.masked} flipped={flipped} tilt />
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
                  <dt className="text-ink-2">Number</dt>
                  <dd className="font-mono tabular-nums">{reveal ? kredoCard.number : kredoCard.masked}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-2">Expiry</dt>
                  <dd className="font-mono">{reveal ? kredoCard.expiry : "••/••"}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-2">CVV</dt>
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
