"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";

const fmt = (n: number) => n.toLocaleString("en-IN");

/** One digit column that rolls up when its digit changes. */
function Digits({ value }: { value: number }) {
  return (
    <span className="inline-flex overflow-hidden" aria-hidden>
      {fmt(value).split("").map((ch, i, arr) => (
        <span key={arr.length - i} className="relative inline-block">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={ch} className="inline-block" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

/**
 * R-section live ticker: sample counts that tick up every couple of seconds while on screen.
 * Counts only (never money). Static under reduced motion; screen readers get the plain numbers.
 */
export function LiveTicker() {
  const t = COPY.landing.ticker;
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [vals, setVals] = useState<number[]>(() => t.items.map((i) => i.v));

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let id: ReturnType<typeof setInterval> | undefined;
    let n = 0;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(id);
      if (!e.isIntersecting) return;
      id = setInterval(() => {
        n += 1;
        const k = (n * 7) % t.items.length; // deterministic spread across the stats
        setVals((v) => v.map((x, i) => (i === k ? x + 1 + (n % 3) : x)));
      }, 1800);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(id);
    };
  }, [reduce, t.items.length]);

  return (
    <section ref={ref} aria-labelledby="ticker-title" className="border-y border-hairline bg-page py-12 sm:py-16">
      <div data-reveal className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <p id="ticker-title" className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-2">
          <span className="relative flex size-2">
            <span className="absolute inset-0 rounded-full bg-ok motion-safe:animate-ping motion-safe:opacity-60" />
            <span className="relative size-2 rounded-full bg-ok" />
          </span>
          {t.label}
        </p>
        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {t.items.map((it, i) => (
            <div key={it.k} className="flex flex-col-reverse border-l border-hairline pl-4">
              <dt className="mt-2 text-[13px] text-ink-2">{it.k}</dt>
              <dd className="tnum text-[clamp(2rem,3.6vw,2.75rem)] font-semibold leading-none tracking-[-0.04em] text-ink">
                <span className="sr-only">{fmt(vals[i])}</span>
                <Digits value={vals[i]} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
