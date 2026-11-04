"use client";

import Link from "next/link";
import { GlassButton, GlassCard } from "@/components/glass";
import { WorldOr } from "./world-or";

/** A screen that exists only in the demo world. Anyone else is pointed to the chooser. */
export function WorldOnly({ children }: { children: React.ReactNode }) {
  return (
    <WorldOr world={children}>
      <GlassCard radius="xl" className="mx-auto max-w-md p-7 text-center">
        <h1 className="text-xl font-extrabold">This page is part of the demo world</h1>
        <p className="mt-2 text-sm text-ink-2">Choose a person to jump in as, and it will show their own limit and record.</p>
        <GlassButton asChild className="mt-5"><Link href="/start">Choose a person</Link></GlassButton>
      </GlassCard>
    </WorldOr>
  );
}
