import { GlassCard } from "@/components/glass";
import { VSUPPORT } from "@/lib/copy-demo";

/** Answers to common stall questions. Static: nothing here changes the world. */
export function SupportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{VSUPPORT.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{VSUPPORT.sub}</p>
      </div>
      <GlassCard radius="lg" className="divide-y divide-hairline p-2">
        {VSUPPORT.faq.map((f) => (
          <details key={f.q} className="group px-3 py-1">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">{f.q}</summary>
            <p className="pb-3 text-sm text-ink-2">{f.a}</p>
          </details>
        ))}
      </GlassCard>
      <p className="text-sm text-ink-2" data-testid="support-contact">{VSUPPORT.contact}</p>
    </div>
  );
}
