"use client";

import { useWorldHydrated, useWorldSync } from "@/lib/store/world";

/** Always mounted: loads the saved demo world once, then keeps it in step with other windows. */
export function WorldRuntime() {
  useWorldHydrated();
  useWorldSync();
  return null;
}
