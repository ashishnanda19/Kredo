import type { Metadata } from "next";
import { AboutAura } from "@/components/aura/about";

export const metadata: Metadata = { title: "About Aura" };

export default function Page() {
  return <AboutAura />;
}
