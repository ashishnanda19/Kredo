"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/quality";

/** A number that counts up from zero the first time it scrolls into view. The final value is in the markup, so it reads correctly before and without script. */
export function CountUp({ to, prefix = "", locale = "en-IN" }: { to: number; prefix?: string; locale?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    if (!seen || reduce || !ref.current) return;
    const el = ref.current;
    const c = animate(0, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => (el.textContent = prefix + Math.round(v).toLocaleString(locale)) });
    return () => c.stop();
  }, [seen, reduce, to, prefix, locale]);
  return <span ref={ref}>{prefix + to.toLocaleString(locale)}</span>;
}
