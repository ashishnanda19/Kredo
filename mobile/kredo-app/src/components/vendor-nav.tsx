import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Text } from "./ui/text";
import { Pulse } from "./motion";
import Svg, { Path, Rect, Circle } from "react-native-svg";

const INK = "#0B0B0C";
const MUTED = "#8A8A90";
const BORDER = "#ECEAE4";

export function VendorNav({ active = "today" }: { active?: "today" | "payments" | "qr" | "settle" | "insights" }) {
  return (
    <View style={s.navBar}>
      {/* Today */}
      <Pressable accessibilityRole="tab" onPress={() => router.push("/(vendor)/today")} style={s.tab}>
        <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={active === "today" ? INK : MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
        </Svg>
        <Text style={[s.label, active === "today" ? s.labelActive : s.labelInactive]}>Today</Text>
      </Pressable>

      {/* Payments */}
      <Pressable accessibilityRole="tab" onPress={() => router.push("/(vendor)/payments")} style={s.tab}>
        <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={active === "payments" ? INK : MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 6h16M4 12h16M4 18h10" />
        </Svg>
        <Text style={[s.label, active === "payments" ? s.labelActive : s.labelInactive]}>Payments</Text>
      </Pressable>

      {/* Center QR Button */}
      <Pressable accessibilityRole="button" accessibilityLabel="Show stall QR" onPress={() => router.push("/(vendor)/qr")} style={s.centerBtnWrap}>
        <Pulse style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F1DD6A" }} />
        <View style={s.centerBtn}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
            <Rect x={4} y={4} width={6} height={6} rx={1} />
            <Rect x={14} y={4} width={6} height={6} rx={1} />
            <Rect x={4} y={14} width={6} height={6} rx={1} />
            <Path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h.01M18 14h.01" />
          </Svg>
        </View>
      </Pressable>

      {/* Payouts */}
      <Pressable accessibilityRole="tab" onPress={() => router.push("/(vendor)/settle")} style={s.tab}>
        <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={active === "settle" ? INK : MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2" />
        </Svg>
        <Text style={[s.label, active === "settle" ? s.labelActive : s.labelInactive]}>Payouts</Text>
      </Pressable>

      {/* Insights */}
      <Pressable accessibilityRole="tab" onPress={() => router.push("/(vendor)/insights")} style={s.tab}>
        <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={active === "insights" ? INK : MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 20V10M12 20V4M19 20v-7" />
        </Svg>
        <Text style={[s.label, active === "insights" ? s.labelActive : s.labelInactive]}>Insights</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  navBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  tab: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontSize: 10,
  },
  labelActive: {
    fontWeight: "800",
    color: INK,
  },
  labelInactive: {
    fontWeight: "600",
    color: MUTED,
  },
  centerBtnWrap: {
    width: 64,
    height: 64,
    marginTop: -30,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1DD6A",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(190,150,0,0.7)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
});
