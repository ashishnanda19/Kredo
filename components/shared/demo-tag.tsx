import { FlaskConical, ShieldCheck } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

/** Inline reminder that nothing here is real money. */
export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warning/45 bg-warning-soft px-3 py-1 text-xs font-semibold text-warning",
        className,
      )}
    >
      <FlaskConical className="size-3.5" aria-hidden /> {COPY.legal.demoTag}
    </span>
  );
}

/** Small "we are not the lender" line. */
export function Disclosure({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted", className)}>
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden /> {COPY.legal.disclosure}
    </p>
  );
}
