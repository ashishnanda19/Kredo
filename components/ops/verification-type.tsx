"use client";

import { useRouter } from "next/navigation";
import { GlassSegmented } from "@/components/glass";

const OPTIONS = [{ value: "students", label: "Students" }, { value: "vendors", label: "Vendors" }] as const;

/** The verification queues come in two kinds: students and stalls. */
export function VerificationType({ current }: { current: "students" | "vendors" }) {
  const router = useRouter();
  return <GlassSegmented label="Who is being verified" options={OPTIONS} value={current} onChange={(v) => v !== current && router.push(v === "vendors" ? "/ops/vendors" : "/ops/verifications")} />;
}
