import type { Metadata } from "next";
import { AuthFlow } from "@/components/portal/auth-flow";

export const metadata: Metadata = { title: "Login" };

export default function Page() {
  return <AuthFlow mode="login" />;
}
