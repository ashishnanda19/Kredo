import { ShieldCheck } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

/** Small "we are not the lender" line. */
export function Disclosure({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-ink-2", className)}>
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden /> {COPY.legal.disclosure}
    </p>
  );
}
