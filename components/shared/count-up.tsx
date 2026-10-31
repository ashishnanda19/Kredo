"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/** Update the existing text node in place; replacing it every frame would make each frame a new LCP candidate. */
function setText(el: HTMLElement, text: string) {
  if (el.firstChild?.nodeType === Node.TEXT_NODE) el.firstChild.nodeValue = text;
  else el.textContent = text;
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface CountUpProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  /** Start animating immediately instead of waiting to scroll into view. */
  immediate?: boolean;
}

/**
 * Counts from 0 to `value` once visible. The server renders the final value
 * (good for no-JS and SEO); the client resets to 0 before first paint, then animates.
 */
export function CountUp({ value, format = (n) => String(Math.round(n)), duration = 1.2, className, immediate }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const started = useRef(false);
  const last = useRef(0);

  useIsoLayoutEffect(() => {
    if (!ref.current || reduce || started.current) return;
    setText(ref.current, format(0));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      setText(el, format(value));
      return;
    }
    if (!(immediate || inView)) return;
    started.current = true;
    const controls = animate(last.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        last.current = v;
        setText(el, format(v));
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, immediate, value, reduce, duration]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
