import type { Metadata } from "next";
import { ActivityView } from "@/components/dashboard/activity-view";
import { ActivityWorld } from "@/components/student/activity-world";
import { WorldOr } from "@/components/student/world-or";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <WorldOr world={<ActivityWorld />}>
      <ActivityView />
    </WorldOr>
  );
}
