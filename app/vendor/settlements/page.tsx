import type { Metadata } from "next";
import { SettlementsPage } from "@/components/vendor/settlements-page";

export const metadata: Metadata = { title: "Settlements" };

export default function Page() {
  return <SettlementsPage />;
}
