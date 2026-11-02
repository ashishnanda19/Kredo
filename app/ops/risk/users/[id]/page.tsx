import { RiskUserDetail } from "@/components/ops/risk/user-detail";

export const metadata = { title: "Student risk detail (internal)" };

export default async function Page({ params }: PageProps<"/ops/risk/users/[id]">) {
  const { id } = await params;
  return <RiskUserDetail id={id} />;
}
