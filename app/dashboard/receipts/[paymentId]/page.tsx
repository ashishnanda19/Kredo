import { ReceiptView } from "@/components/loans/print-docs";

export const metadata = { title: "Receipt" };

export default async function Page({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  return <ReceiptView id={paymentId} />;
}
