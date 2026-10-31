import { Skeleton } from "@/components/ui/skeleton";

const shell = "glass rounded-[24px] p-5";

export function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <Skeleton className="size-11 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}

/** Grid cells for every dashboard section except the limit card (which renders instantly from cached data). */
export function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="aspect-[1.586/1] w-full rounded-hero" />
      <div className="grid grid-cols-4 gap-3 md:col-span-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="size-14 rounded-2xl" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <div className={shell}>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-3 h-10 w-36" />
        <Skeleton className="mt-4 h-14 w-full rounded-full" />
      </div>
      <div className={shell}>
        <Skeleton className="mx-auto h-28 w-56 rounded-t-full" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </div>
      <div className={shell}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="size-11" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className={shell}>
        <Skeleton className="mx-auto size-40 rounded-full" />
      </div>
      <span role="status" className="sr-only">Loading your dashboard…</span>
    </>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="glass rounded-[24px] p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-11" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
