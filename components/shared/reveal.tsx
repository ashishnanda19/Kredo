"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fade + rise when scrolled into view (once). */
export function Reveal({ delay = 0, y = 24, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease, delay }}
      {...props}
    />
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

/** Staggered list entrance. Wrap items in <StaggerItem>. */
export function Stagger({ inView = true, ...props }: HTMLMotionProps<"div"> & { inView?: boolean }) {
  return inView ? (
    <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }} {...props} />
  ) : (
    <motion.div variants={container} initial="hidden" animate="show" {...props} />
  );
}

export function StaggerItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={item} {...props} />;
}
