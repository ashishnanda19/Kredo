import type { Metadata } from "next";
import { LevelUp } from "@/components/aura/level-up";

export const metadata: Metadata = { title: "Level up" };

export default function Page() {
  return <LevelUp />;
}
