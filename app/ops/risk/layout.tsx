import type { Metadata } from "next";
import { RevealProvider, RiskNav } from "@/components/ops/risk/parts";

export const metadata: Metadata = { title: "Risk console (internal)", robots: { index: false, follow: false } };

export default function RiskLayout({ children }: { children: React.ReactNode }) {
  return (
    <RevealProvider>
      <RiskNav />
      {children}
    </RevealProvider>
  );
}
