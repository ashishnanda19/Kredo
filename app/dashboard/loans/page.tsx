import type { Metadata } from "next";
import { LoansOverview } from "@/components/loans/loans-overview";
import { LoansWorld } from "@/components/student/loans-world";
import { WorldOr } from "@/components/student/world-or";

export const metadata: Metadata = { title: "My loans" };

export default function Page() {
  return (
    <WorldOr world={<LoansWorld />}>
      <LoansOverview />
    </WorldOr>
  );
}
