import type { Metadata } from "next";
import { StartChooser } from "@/components/demo/start-chooser";

export const metadata: Metadata = { title: "Get started" };

export default function Page() {
  return <StartChooser />;
}
