"use client";

import { useWorld, useWorldHydrated } from "@/lib/store/world";

/** The signed-in demo-world student, if any, and the world they live in. */
export function useWorldStudent() {
  const hydrated = useWorldHydrated();
  const studentId = useWorld((s) => s.session.studentId);
  const world = useWorld((s) => s.world);
  return { hydrated, studentId, world, student: studentId ? world.students[studentId] : undefined };
}
