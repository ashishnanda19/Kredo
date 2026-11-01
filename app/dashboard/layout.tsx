import type { Metadata } from "next";
import { BottomTabs, SideRail } from "@/components/dashboard/shell";
import { DashboardGate } from "@/components/portal/dashboard-gate";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash flex min-h-[calc(100dvh-var(--bar-h))]">
      <SideRail />
      <div className="min-w-0 flex-1">
        <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-32 pt-4 sm:px-6 lg:pb-12 lg:pt-6">
          <DashboardGate>{children}</DashboardGate>
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
