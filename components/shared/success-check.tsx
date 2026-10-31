"use client";

import { motion } from "framer-motion";

/** Animated tick inside a pulsing ring. Used for every success state. */
export function SuccessCheck({ size = 88 }: { size?: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label="Success">
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-success/25"
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut", repeat: 2 }}
      />
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-success"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      />
      <svg viewBox="0 0 52 52" className="relative size-1/2" aria-hidden>
        <motion.path
          d="M14 27 l8 8 l16 -17"
          fill="none"
          stroke="var(--background)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
