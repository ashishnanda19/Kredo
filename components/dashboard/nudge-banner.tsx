import { HeartHandshake } from "lucide-react";
import { Disclosure } from "@/components/shared/demo-tag";
import { COPY } from "@/lib/copy";

export function NudgeBanner() {
  return (
    <aside aria-label="Responsible borrowing" className="glass flex items-start gap-4 rounded-[24px] p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#0b0b0c] text-accent dark:bg-white/[0.08]">
        <HeartHandshake className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{COPY.legal.nudge}</p>
        <p className="text-sm text-ink-2">{COPY.dashboard.nudge.body}</p>
        <Disclosure />
      </div>
    </aside>
  );
}
