import { Suspense } from "react";
import { RiskAlerts } from "@/components/ops/risk/alerts";

export const metadata = { title: "Fraud alerts (internal)" };

export default function Page() {
  return (
    <Suspense>
      <RiskAlerts />
    </Suspense>
  );
}
