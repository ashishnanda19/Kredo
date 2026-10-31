"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";

interface EmptyStateProps {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}

/** Friendly empty state with a small floating illustration (pure SVG/CSS). */
export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <motion.div
        aria-hidden
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-5 grid size-20 place-items-center rounded-3xl bg-accent-soft text-ink"
      >
        <Inbox className="size-9" />
        <span className="absolute -right-2 -top-2 size-4 rounded-full bg-warn" />
        <span className="absolute -bottom-1 -left-3 size-3 rounded-full bg-ok" />
      </motion.div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-ink-2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Oops, that didn't load",
  body = COPY.states.errorBody,
  onRetry,
  className,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <div aria-hidden className="mb-5 grid size-20 place-items-center rounded-3xl bg-danger-soft text-bad-text">
        <AlertTriangle className="size-9" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-ink-2">{body}</p>
      {onRetry && (
        <GlassButton variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden /> {COPY.states.retry}
        </GlassButton>
      )}
    </div>
  );
}
