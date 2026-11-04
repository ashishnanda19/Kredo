import type { Metadata } from "next";
import { RecoveryWorld } from "@/components/student/recovery-world";
import { WorldOnly } from "@/components/student/world-only";

export const metadata: Metadata = { title: "Getting spending back" };

export default function Page() {
  return (
    <WorldOnly>
      <RecoveryWorld />
    </WorldOnly>
  );
}
