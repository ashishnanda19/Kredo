import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();
  const { role, token, isVerified } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace("/(auth)/splash");
      return;
    }
    if (role === "student") router.replace("/(student)/home");
    else if (role === "vendor") router.replace("/(vendor)/today");
    else router.replace("/(auth)/welcome");
  }, [token, role, router]);

  return <ActivityIndicator style={{ marginTop: 40 }} color="#0B0B0C" />;
}
