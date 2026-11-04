import type { Metadata } from "next";
import { LimitWorld } from "@/components/student/limit-world";
import { WorldOnly } from "@/components/student/world-only";

export const metadata: Metadata = { title: "Your limit" };

export default function Page() {
  return (
    <WorldOnly>
      <LimitWorld />
    </WorldOnly>
  );
}
