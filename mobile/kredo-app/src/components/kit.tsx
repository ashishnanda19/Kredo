import { type ReactNode } from "react";
import { View, Pressable, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import { Rise, Pop } from "@/components/motion";

/**
 * Building blocks repeated across the Claude Design artboards. Values are
 * copied from the artboard CSS (Privacy, Notifications, Aura, ...).
 */

export const C = {
  ink: "#0B0B0C",
  sheet: "#FAF9F6",
  border: "#ECEAE4",
  line: "#F1EFE9",
  muted: "#6B6B70",
  mutedSoft: "#8A8A90",
  cream: "#F1DD6A",
  amber: "#FBF3C4",
  green: "#2E9B57",
  greenBg: "#E3F2E8",
  greenInk: "#1B6B3A",
  red: "#A3261B",
  redBg: "#F9E1DE",
} as const;

export const cardShadow: ViewStyle = Platform.select({
  android: { elevation: 2 },
  default: { shadowColor: C.ink, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 12 },
}) as ViewStyle;

/** Yellow page with the soft top glow and the rounded sheet starting at `sheetTop`. */
export function Screen({ sheetTop, glow = true, children }: { sheetTop: number; glow?: boolean; children?: ReactNode }) {
  return (
    <LinearGradient colors={["#F8DE45", "#F4D52F"]} style={{ flex: 1 }}>
      {glow && <Glow style={k.glow} />}
      <View style={[k.sheet, { top: sheetTop }]} />
      {children}
    </LinearGradient>
  );
}

export function BackButton({ label = "Back", onPress }: { label?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress ?? (() => router.back())} style={k.round} accessibilityLabel={label}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 6l-6 6 6 6" />
      </Svg>
    </Pressable>
  );
}

/** Back button, centred title and an optional right-hand control (44px spacer otherwise). */
export function TopBar({ title, right, back }: { title: string; right?: ReactNode; back?: () => void }) {
  return (
    <Rise style={k.topBar}>
      <BackButton onPress={back} />
      <Text style={k.title}>{title}</Text>
      {right ?? <View style={{ width: 44 }} />}
    </Rise>
  );
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text style={k.sectionLabel}>{children}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[k.card, style]}>{children}</View>;
}

export function Toast({ text, width = 260 }: { text: string; width?: number }) {
  if (!text) return null;
  return (
    <Pop style={[k.toast, { width, marginLeft: -width / 2 }]}>
      <Text style={k.toastText}>{text}</Text>
    </Pop>
  );
}

/** 48 by 28 switch. Locked switches show grey when on. */
export function Toggle({ on, locked, onPress, label }: { on: boolean; locked?: boolean; onPress?: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled: locked }}
      accessibilityLabel={label}
      style={[k.toggle, { backgroundColor: on ? (locked ? C.mutedSoft : C.green) : "#CFCBC0" }]}
    >
      <View style={[k.knob, { left: on ? 23 : 3 }]} />
    </Pressable>
  );
}

export const k = StyleSheet.create({
  glow: {
    position: "absolute",
    left: "50%",
    top: -60,
    width: 460,
    height: 300,
    marginLeft: -230,
    backgroundColor: "rgba(255,246,205,0.75)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: C.sheet,
    shadowColor: "rgb(120,90,0)",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  topBar: {
    paddingTop: 32,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "800", letterSpacing: -0.34 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.44,
    textTransform: "uppercase",
    color: C.muted,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 24,
    paddingVertical: 2,
    paddingHorizontal: 16,
    ...cardShadow,
  },
  line: { borderTopWidth: 1, borderTopColor: C.line },
  toast: {
    position: "absolute",
    left: "50%",
    top: 92,
    height: 40,
    zIndex: 8,
    borderRadius: 20,
    backgroundColor: C.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toastText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  toggle: { width: 48, height: 28, borderRadius: 14 },
  knob: {
    position: "absolute",
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowSub: { fontSize: 12, fontWeight: "500", color: C.muted, marginTop: 2, lineHeight: 17 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.line,
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: C.amber,
  },
  noteText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  bigButton: {
    height: 60,
    borderRadius: 30,
    backgroundColor: C.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bigButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
