"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store/store";
import { useWorld, useWorldHydrated } from "@/lib/store/world";

/**
 * The first page inside a phone frame on the Demo Stage. It signs this frame in as the chosen person (the person lives
 * in this frame's own session, so the two phones can differ), lines up the original portal's login state when the
 * person is a student, and moves on to the requested screen.
 */
export function FrameBoot() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useWorldHydrated();

  const role = params.get("role") === "vendor" ? "vendor" : "student";
  const student = params.get("student");
  const vendor = params.get("vendor");
  const path = params.get("path");
  const to = path && path.startsWith("/") && !path.startsWith("//") ? path : role === "vendor" ? "/vendor" : "/dashboard";

  useEffect(() => {
    if (!hydrated) return;
    const world = useWorld.getState().world;
    if (role === "student" && student && world.students[student]) {
      useStore.getState().applyPreset(world.students[student].verification === "accepted" ? "verified" : "new_student");
    }
    useWorld.getState().enterAs(student && world.students[student] ? student : null, vendor && world.vendors[vendor] ? vendor : null, role);
    router.replace(to);
  }, [hydrated, role, student, vendor, to, router]);

  return <div role="status" aria-label="Loading" className="grid min-h-dvh place-items-center text-sm text-ink-2">Loading…</div>;
}
