import type { Metadata } from "next";
import { MetricsPage } from "@/components/demo/metrics-page";

export const metadata: Metadata = { title: "Investor metrics" };

export default function Page() {
  return <MetricsPage />;
}
