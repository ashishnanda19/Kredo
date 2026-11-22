import { Text as RNText, type TextProps, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";

const presets: Record<string, string> = {
  h1: "text-[26px] font-[800] tracking-[-0.04em]",
  h2: "text-[19px] font-[800] tracking-[-0.02em]",
  h3: "text-[17px] font-[800] tracking-[-0.02em]",
  body: "text-[15px] font-[700]",
  label: "text-[13px] font-[600]",
  small: "text-[12px] font-[700]",
  caption: "text-[11px] font-[700]",
  muted: "text-[13px] font-[500] text-muted",
  captionMuted: "text-[11px] font-[700] text-mutedSoft",
};

export function PresetText({ kind = "body", className, children, ...props }: { kind?: keyof typeof presets; className?: string; children: React.ReactNode } & TextProps) {
  return <RNText {...props} className={cn("font-Inter", presets[kind], className)}>{children}</RNText>;
}

export { PresetText as Text };
