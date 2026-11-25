import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { Text } from "./ui/text";
import { Pulse } from "./motion";

const INK = "#0B0B0C";
const MUTED = "#8A8A90";
const BORDER = "#ECEAE4";
const YELLOW = "#F5D832";

type TabId = "home" | "dues" | "scan" | "aura" | "passport";

export function BottomNav({ active = "home" }: { active?: TabId }) {
  const router = useRouter();

  return (
    <View style={styles.navBar}>
      {/* Home Tab */}
      <Pressable accessibilityRole="tab" onPress={() => router.push("/(student)/home")} style={styles.tab}>
        <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={active === "home" ? INK : MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
        </Svg>
        <Text style={[styles.tabLabel, active === "home" ? styles.tabLabelActive : styles.tabLabelInactive]}>
          Home
        </Text>
      </Pressable>

      {/* Dues Tab */}
      <Pressable accessibilityRole="tab" onPress={() => router.push("/(student)/dues")} style={styles.tab}>
        <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={active === "dues" ? INK : MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="4" y="5" width="16" height="15" rx="3" />
          <Path d="M8 3v4M16 3v4M4 10h16" />
        </Svg>
        <Text style={[styles.tabLabel, active === "dues" ? styles.tabLabelActive : styles.tabLabelInactive]}>
          Dues
        </Text>
      </Pressable>

      {/* Center Scan FAB */}
      <Pressable accessibilityRole="button" accessibilityLabel="Scan to pay" onPress={() => router.push("/(student)/scan")} style={styles.centerFabWrap}>
        <Pulse style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F1DD6A" }} />
        <View style={styles.centerFab}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
            <Path d="M4 12h16" />
          </Svg>
        </View>
      </Pressable>

      {/* Aura Tab */}
      <Pressable accessibilityRole="tab" onPress={() => router.push("/(student)/aura")} style={styles.tab}>
        <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={active === "aura" ? INK : MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4zM18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
        </Svg>
        <Text style={[styles.tabLabel, active === "aura" ? styles.tabLabelActive : styles.tabLabelInactive]}>
          Aura
        </Text>
      </Pressable>

      {/* Passport Tab */}
      <Pressable accessibilityRole="tab" onPress={() => router.push("/(student)/passport")} style={styles.tab}>
        <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={active === "passport" ? INK : MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="5" width="18" height="14" rx="3" />
          <Circle cx="9" cy="11" r="2" />
          <Path d="M6 16c.8-1.6 4.2-1.6 5 0M14 10h4M14 13h3" />
        </Svg>
        <Text style={[styles.tabLabel, active === "passport" ? styles.tabLabelActive : styles.tabLabelInactive]}>
          Passport
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
    zIndex: 10,
  },
  tab: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
  },
  tabLabelActive: {
    fontWeight: "800",
    color: INK,
  },
  tabLabelInactive: {
    fontWeight: "600",
    color: MUTED,
  },
  centerFabWrap: {
    width: 64,
    height: 64,
    marginTop: -30,
    alignItems: "center",
    justifyContent: "center",
  },
  centerFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: YELLOW,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(190,150,0,0.7)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
});
