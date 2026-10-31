import type { Metadata } from "next";
import { SupportList } from "@/components/support/support-list";

export const metadata: Metadata = { title: "Support and complaints" };

export default function Page() {
  return <SupportList />;
}
