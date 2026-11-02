import type { Metadata } from "next";
import { AuraHistory } from "@/components/aura/aura-history";

export const metadata: Metadata = { title: "Aura history" };

export default function Page() {
  return <AuraHistory />;
}
