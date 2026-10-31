import { cn } from "@/lib/utils";

/** Ramp-style two-tone heading: the first sentence in ink, the second in a quieter grey, same size. */
export function TwoTone({ a, b, id, className, dark }: { a: string; b: string; id?: string; className?: string; dark?: boolean }) {
  return (
    <h2 id={id} className={cn("text-balance text-[clamp(1.9rem,4.2vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em]", className)}>
      <span className={dark ? "text-white" : "text-ink"}>{a}</span> <span className={dark ? "text-white/45" : "text-ink-2/80"}>{b}</span>
    </h2>
  );
}
