"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useWorldStudent } from "./use-student";

/**
 * Shows the demo-world screen when a seeded or newly verified student is signed in to the world, and the original
 * portal screen otherwise. The original screens are untouched.
 */
export function WorldOr({ world, children }: { world: React.ReactNode; children: React.ReactNode }) {
  const { hydrated, studentId } = useWorldStudent();
  if (!hydrated)
    return (
      <div role="status" aria-label="Loading" className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-[28px]" />
      </div>
    );
  return studentId ? <>{world}</> : <>{children}</>;
}
