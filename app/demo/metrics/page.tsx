import type { Metadata } from "next";
import { MetricsPage } from "@/components/demo/metrics-page";

export const metadata: Metadata = { title: "Investor metrics (simulated)" };

export default function Page() {
  return <MetricsPage />;
}
