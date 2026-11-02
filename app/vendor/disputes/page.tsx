import type { Metadata } from "next";
import { RefundsPage } from "@/components/vendor/refunds-page";

export const metadata: Metadata = { title: "Refunds" };

export default function Page() {
  return <RefundsPage />;
}
