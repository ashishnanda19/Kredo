import "../global.css";
import { View } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { ThemeProvider } from "@/components/theme-provider";
import { queryClient } from "@/services/query";
import { ActivityIndicator } from "react-native";

const YELLOW = "#F8DE45";

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: YELLOW }}>
        <ActivityIndicator size="large" color="#0B0B0C" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <View className="flex-1" style={{ flex: 1, minHeight: "100vh" as any }}>
          <Slot />
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
