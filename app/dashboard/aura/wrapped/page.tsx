import type { Metadata } from "next";
import { Wrapped } from "@/components/aura/wrapped";

export const metadata: Metadata = { title: "Aura Wrapped" };

export default function Page() {
  return <Wrapped />;
}
