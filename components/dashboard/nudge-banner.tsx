import { HeartHandshake } from "lucide-react";
import { Disclosure } from "@/components/shared/demo-tag";
import { COPY } from "@/lib/copy";

export function NudgeBanner() {
  return (
    <aside aria-label="Responsible borrowing" className="flex items-start gap-3 glass glass-soft rounded-[22px] p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-ink">
        <HeartHandshake className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-bold">{COPY.legal.nudge}</p>
        <p className="text-sm text-ink-2">{COPY.dashboard.nudge.body}</p>
        <Disclosure />
      </div>
    </aside>
  );
}
