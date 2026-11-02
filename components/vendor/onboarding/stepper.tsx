import { Check } from "lucide-react";
import { ONB } from "@/lib/copy-demo";
import { cn } from "@/lib/utils";
import { STEP_ORDER, type Step } from "./use-onboarding";

/** The five onboarding steps. The current one is marked for screen readers as well as by colour. */
export function Stepper({ step }: { step: Step }) {
  const at = STEP_ORDER.indexOf(step);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-2">{ONB.stepOf(at + 1, STEP_ORDER.length)}</p>
      <ol className="mt-2 flex gap-1.5" aria-label="Onboarding steps">
        {ONB.steps.map((label, i) => (
          <li key={label} aria-current={i === at ? "step" : undefined} className="min-w-0 flex-1">
            <span className={cn("block h-1.5 rounded-full", i <= at ? "bg-accent" : "bg-ink/15")} />
            <span className={cn("mt-1.5 flex items-center gap-1 truncate text-[11px] font-semibold", i === at ? "text-ink" : "text-ink-2")}>
              {i < at && <Check className="size-3 shrink-0" aria-hidden />}
              <span className="truncate">{label}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
