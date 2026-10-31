import { cn } from "@/lib/utils";

/** Shimmer-free pulse placeholder (pulse is disabled automatically under reduced motion). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-foreground/10 motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
