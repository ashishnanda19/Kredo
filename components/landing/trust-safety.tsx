import { Landmark, LockKeyhole, MessageSquareWarning } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { GRIEVANCE } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { SectionHeading } from "./section-heading";

/** Placeholder copy throughout this section. Replace with reviewed legal text before launch. */
export function TrustSafety() {
  const t = COPY.trust;
  const icons = [LockKeyhole, Landmark, MessageSquareWarning];
  return (
    <section id="trust" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading eyebrow={t.eyebrow} lines={["Clear about", "who does what."]} accent={1} />

      <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
        {t.cards.map((c, i) => {
          const Icon = icons[i];
          return (
            <StaggerItem key={c.title}>
              <GlassCard radius="lg" className="h-full p-6" id={i === 2 ? "grievance" : undefined}>
                <Icon className="size-7 text-neon-violet" aria-hidden />
                <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                  {i === 2 ? (
                    <>
                      {GRIEVANCE.officer}:{" "}
                      <a className="font-bold text-neon-blue underline underline-offset-4" href={`mailto:${GRIEVANCE.email}`}>
                        {GRIEVANCE.email}
                      </a>
                      . {GRIEVANCE.response}
                    </>
                  ) : (
                    c.body
                  )}
                </p>
              </GlassCard>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
