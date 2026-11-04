"use client";

import Link from "next/link";
import { DEMO_ENABLED } from "@/components/portal/demo-controls";
import { FLOW } from "@/lib/copy-demo";
import { MoneyFlow } from "./money-flow";

/** The diagram on its own, big enough for the back of a room. It animates on real events, and can be previewed with the buttons. */
export function FlowPage() {
  if (!DEMO_ENABLED) return <main id="main" className="p-8 text-center text-ink-2">Demo tools are off.</main>;
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{FLOW.title}</h1>
        <div className="flex items-center gap-3"><Link href="/demo" className="text-sm font-semibold underline">Demo Stage</Link></div>
      </div>
      <MoneyFlow preview />
    </main>
  );
}
