import type { Metadata } from "next";
import { ProfileView } from "@/components/dashboard/profile-view";
import { ProfileWorld } from "@/components/student/profile-world";
import { WorldOr } from "@/components/student/world-or";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <WorldOr world={<ProfileWorld />}>
      <ProfileView />
    </WorldOr>
  );
}
