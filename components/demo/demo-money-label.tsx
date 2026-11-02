import { FlaskConical } from "lucide-react";
import { DEMO_LABEL } from "@/lib/copy-demo";
import { cn } from "@/lib/utils";

/** The persistent "nothing here is real money" label for every demo-world surface. */
export function DemoMoneyLabel({ className }: { className?: string }) {
  return (
    <span data-testid="demo-money-label" className={cn("inline-flex items-center gap-1.5 rounded-full border border-warn/45 bg-warning-soft px-3 py-1 text-xs font-semibold text-warn-text", className)}>
      <FlaskConical className="size-3.5" aria-hidden /> {DEMO_LABEL}
    </span>
  );
}
