import type { Metadata } from "next";
import { FlowPage } from "@/components/demo/flow-page";

export const metadata: Metadata = { title: "Money flow" };

export default function Page() {
  return <FlowPage />;
}
