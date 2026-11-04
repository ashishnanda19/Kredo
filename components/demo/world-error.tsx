"use client";

import Link from "next/link";
import { useEffect } from "react";
import { GlassButton, GlassCard } from "@/components/glass";
import { ERROR_W } from "@/lib/copy-demo";
import { useStore } from "@/lib/store/store";
import { useWorld } from "@/lib/store/world";

/** The error screen for the demo-world areas. A corrupted demo state is always fixable by resetting it. */
export function WorldError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <GlassCard radius="xl" strength="strong" role="alert" data-testid="world-error" className="mx-auto mt-10 max-w-md space-y-4 p-7 text-center">
      <h1 className="text-xl font-extrabold">{ERROR_W.title}</h1>
      <p className="text-sm text-ink-2">{ERROR_W.body}</p>
      <div className="flex flex-col gap-2">
        <GlassButton onClick={() => retry()}>{ERROR_W.retry}</GlassButton>
        <GlassButton variant="outline" data-testid="error-reset" onClick={() => { useWorld.getState().reset(); useStore.getState().resetAll(); retry(); }}>{ERROR_W.reset}</GlassButton>
        <GlassButton asChild variant="ghost"><Link href="/start">{ERROR_W.home}</Link></GlassButton>
      </div>
    </GlassCard>
  );
}
