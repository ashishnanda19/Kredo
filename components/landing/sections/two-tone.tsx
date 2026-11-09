import { cn } from "@/lib/utils";

/** Each word sits in its own mask so SectionFx can lift the words into place one after another (visible as plain text without script). */
function Words({ text }: { text: string }) {
  return text.split(" ").map((w, i, all) => (
    <span key={i}>
      <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
        <span data-w className="inline-block will-change-transform">{w}</span>
      </span>
      {i < all.length - 1 ? " " : ""}
    </span>
  ));
}

/** Ramp-style two-tone heading: the first sentence in ink, the second in a quieter grey, same size. */
export function TwoTone({ a, b, id, className, dark }: { a: string; b: string; id?: string; className?: string; dark?: boolean }) {
  return (
    <h2 id={id} data-words className={cn("text-balance text-[clamp(1.9rem,4.2vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em]", className)}>
      <span className={dark ? "text-white" : "text-ink"}><Words text={a} /></span> <span className={dark ? "text-white/45" : "text-ink-2/80"}><Words text={b} /></span>
    </h2>
  );
}
