"use client";

import { useWorldHydrated } from "@/lib/store/world";

/** Always mounted: loads the saved demo world from localStorage once, in the browser. */
export function WorldRuntime() {
  useWorldHydrated();
  return null;
}
