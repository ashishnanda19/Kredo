import { Suspense } from "react";
import type { Metadata } from "next";
import { Stage } from "@/components/demo/stage";

export const metadata: Metadata = { title: "Demo Stage" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Stage />
    </Suspense>
  );
}
