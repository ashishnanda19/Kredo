import { Skeleton } from "@/components/ui/skeleton";

export function RowsSkeleton({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-2xl" />
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
