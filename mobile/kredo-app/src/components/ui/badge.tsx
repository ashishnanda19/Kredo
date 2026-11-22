import { View } from "react-native";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "ink" | "cream";
  className?: string;
}

export function Badge({ children, variant = "ink", className }: BadgeProps) {
  const variants: Record<string, string> = {
    success: "bg-greenBg text-green font-bold",
    warning: "bg-amber text-ink font-bold",
    ink: "bg-ink text-white font-bold",
    cream: "bg-cream text-ink font-bold",
  };
  return (
    <View className={cn("flex-row items-center justify-center gap-1 radius-pill px-2 py-0.5 text-[10px]", variants[variant], className)}>
      {children}
    </View>
  );
}
