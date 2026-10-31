import { GraduationCap } from "lucide-react";
import { COPY } from "@/lib/copy";
import { colleges } from "@/lib/mock-data";

/**
 * PLACEHOLDER CONTENT: the colleges below are fictional and the claim is illustrative.
 * Replace with real partner campuses (and only with their permission) before launch.
 */
export function SocialProof() {
  const row = [...colleges, ...colleges];
  return (
    <section aria-label="Campuses" className="relative py-10">
      <p className="px-4 text-center text-sm font-semibold text-muted">{COPY.proof.line}</p>
      <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <ul className="flex w-max animate-marquee gap-3 motion-reduce:animate-none">
          {row.map((c, i) => (
            <li
              key={`${c}-${i}`}
              aria-hidden={i >= colleges.length}
              className="glass glass-soft inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold"
            >
              <GraduationCap className="size-4 text-neon-violet" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
