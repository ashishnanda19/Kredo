import { Suspense } from "react";
import { RiskUsers } from "@/components/ops/risk/users";

export const metadata = { title: "Risk users (internal)" };

export default function Page() {
  return (
    <Suspense>
      <RiskUsers />
    </Suspense>
  );
}
