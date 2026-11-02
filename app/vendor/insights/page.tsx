import type { Metadata } from "next";
import { StubPage } from "@/components/vendor/stub-page";

export const metadata: Metadata = { title: "Insights" };

export default function Page() {
  return <StubPage title="Insights" milestone="Milestone 7" />;
}
