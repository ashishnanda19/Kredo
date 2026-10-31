import { StatementView } from "@/components/loans/print-docs";

export const metadata = { title: "Loan statement" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StatementView id={id} />;
}
