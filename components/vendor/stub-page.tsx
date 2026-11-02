import { GlassCard } from "@/components/glass";
import { VENDOR } from "@/lib/copy-demo";

/** Placeholder for a vendor page that is built in a later milestone. */
export function StubPage({ title, milestone }: { title: string; milestone: string }) {
  return (
    <GlassCard radius="xl" className="p-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-ink-2">{VENDOR.later(milestone)}</p>
    </GlassCard>
  );
}
