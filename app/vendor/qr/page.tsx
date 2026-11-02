import type { Metadata } from "next";
import { QrPage } from "@/components/vendor/qr-page";

export const metadata: Metadata = { title: "Your QR" };

export default function Page() {
  return <QrPage />;
}
