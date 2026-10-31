import { Info } from "lucide-react";
import { GlassFieldError } from "@/components/glass";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  /** one-line "why we ask" */
  why?: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

/** Label + control + "why we ask" + animated error. The control must set id and aria-describedby={`${id}-msg`}. */
export function Field({ id, label, why, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="mb-0">
        {label}
      </Label>
      {children}
      {(why || hint) && (
        <p id={`${id}-msg`} className="flex items-start gap-1.5 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {why}
            {hint ? ` ${hint}` : ""}
          </span>
        </p>
      )}
      <GlassFieldError id={`${id}-err`}>{error}</GlassFieldError>
    </div>
  );
}
