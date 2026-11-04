import { Suspense } from "react";
import type { Metadata } from "next";
import { FrameBoot } from "@/components/demo/frame-boot";

export const metadata: Metadata = { title: "Phone frame", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FrameBoot />
    </Suspense>
  );
}
