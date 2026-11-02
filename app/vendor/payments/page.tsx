import type { Metadata } from "next";
import { PaymentsList } from "@/components/vendor/payments-list";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return <PaymentsList />;
}
