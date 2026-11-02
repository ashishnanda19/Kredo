import type { Metadata } from "next";
import { VendorShell } from "@/components/vendor/vendor-shell";

export const metadata: Metadata = { title: { default: "Vendor", template: "%s | Vendor" } };

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <VendorShell>{children}</VendorShell>;
}
