import { VerificationDetail } from "@/components/ops/verification-detail";

export const metadata = { title: "Verification review (internal)" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VerificationDetail id={id} />;
}
