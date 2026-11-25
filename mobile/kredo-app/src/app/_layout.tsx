import "../global.css";
import { View } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Slot, usePathname } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
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
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
/** Screens that are yellow right to the bottom edge (celebrations and the splash). */
const FULL_YELLOW: Record<string, string> = {
  "/splash": "#F2D12A",
  "/paid": "#F5D832",
  "/repaid": "#F5D832",
  "/unlocked": "#F5D832",
  "/live": "#F5D832",
  "/received": "#F5D832",
};

// Keep the native yellow splash up until the fonts are ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const bottomColor = FULL_YELLOW[pathname] ?? SHEET;
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

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
        {/* The artboards are drawn without a status bar or home indicator: keep them clear of both. */}
        <View style={{ flex: 1, backgroundColor: YELLOW }}>
          <StatusBar style="dark" />
          <View style={{ height: Math.max(0, insets.top - 20), backgroundColor: YELLOW }} />
          <View style={{ flex: 1, overflow: "hidden" }}>
            <Slot />
          </View>
          <View style={{ height: Math.max(0, insets.bottom - 14), backgroundColor: bottomColor }} />
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
