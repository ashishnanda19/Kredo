import type { Metadata } from "next";
import { DataRights } from "@/components/portal/data-rights";

export const metadata: Metadata = { title: "My data and privacy" };

export default function Page() {
  return <DataRights />;
}
