import { LoanDetail } from "@/components/loans/loan-detail";
import { LoanDetailWorld } from "@/components/student/loan-detail-world";
import { WorldOr } from "@/components/student/world-or";

export const metadata = { title: "Coin details" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <WorldOr world={<LoanDetailWorld id={id} />}>
      <LoanDetail id={id} />
    </WorldOr>
  );
}
