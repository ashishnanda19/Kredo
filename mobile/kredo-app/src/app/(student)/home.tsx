import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { BottomNav } from "@/components/bottom-nav";
import { useAuthStore } from "@/store/auth";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

const SPENT_BARS = [
  { day: "M", h: 36, bg: "#EAE7DF" },
  { day: "T", h: 54, bg: "#EAE7DF" },
  { day: "W", h: 28, bg: "#EAE7DF" },
  { day: "T", h: 68, bg: "#EAE7DF" },
  { day: "F", h: 88, bg: "#E3CB4A" }, // Peak day
  { day: "S", h: 42, bg: "#EAE7DF" },
];

export default function Home() {
  const router = useRouter();
  const { student } = useAuthStore();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [balance, setBalance] = useState(0);

  const s = student ?? { name: "Aarav", limit: 3000, used: 1150, aura: 82 };
  const targetBalance = s.limit - s.used;

  useEffect(() => {
    const start = Date.now();
    const duration = 1000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const val = 1 - Math.pow(1 - progress, 3);
      setBalance(Math.round(targetBalance * val));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [targetBalance]);

  return (
    <View style={styles.container}>
      {/* Background yellow header & glow */}
      <View style={styles.headerGlow} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push("/(student)/profile")} style={styles.avatarBtn}>
          <Text style={styles.avatarText}>{s.name[0] || "A"}</Text>
        </Pressable>

        <View style={styles.greetingWrap}>
          <Text style={styles.dateText}>Sat 7 Nov</Text>
          <Text style={styles.greetingText}>Hey {s.name}</Text>
        </View>

        <View style={styles.topActions}>
          <Pressable onPress={() => router.push("/(student)/notifications")} style={styles.notifBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
              <Path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
            </Svg>
            <View style={styles.notifDot} />
          </Pressable>

          <Pressable onPress={() => router.push("/(student)/aura")} style={styles.auraPill}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill={INK}>
              <Path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z" />
            </Svg>
            <Text style={styles.auraText}>{s.aura}</Text>
          </Pressable>
        </View>
      </View>

      {/* Available to Spend Section */}
      <View style={styles.spendSection}>
        <Text style={styles.spendMeta}>Available to spend</Text>
        <Pressable onPress={() => setBalanceHidden(!balanceHidden)} style={styles.amountToggle}>
          {balanceHidden ? (
            <Text style={[styles.amountDisplay, { color: "rgba(11,11,12,0.35)" }]}>₹ ••••</Text>
          ) : (
            <Text style={styles.amountDisplay}>₹{balance.toLocaleString("en-IN")}</Text>
          )}
        </Pressable>

        <View style={styles.limitBarWrap}>
          <View style={styles.limitTrack}>
            <View style={styles.limitFill} />
          </View>
          <Pressable onPress={() => router.push("/(student)/limit")} style={styles.limitLink}>
            <Text style={styles.limitText}>of ₹3,000</Text>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 6l6 6-6 6" />
            </Svg>
          </Pressable>
        </View>
      </View>

      {/* Main Sheet with Rounded Corners */}
      <View style={styles.sheetContainer}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 4 Quick Actions Grid */}
          <View style={styles.quickGrid}>
            <Pressable onPress={() => router.push("/(student)/limit")} style={styles.quickCol}>
              <View style={styles.quickIconBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
                </Svg>
              </View>
              <Text style={styles.quickLabel}>Limit</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/(student)/repay")} style={styles.quickCol}>
              <View style={styles.quickIconBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 3v12M7 10l5 5 5-5M5 20h14" />
                </Svg>
              </View>
              <Text style={styles.quickLabel}>Repay</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/(student)/activity")} style={styles.quickCol}>
              <View style={styles.quickIconBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 6h16M4 12h16M4 18h10" />
                </Svg>
              </View>
              <Text style={styles.quickLabel}>Activity</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/(student)/loan")} style={styles.quickCol}>
              <View style={styles.quickIconBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="9" />
                  <Path d="M12 7v10M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.5 2.5 1.6S13.4 11 12 11s-2.5.6-2.5 1.7S10.6 15 12 15s2.5-.4 2.5-1.5" />
                </Svg>
              </View>
              <Text style={styles.quickLabel}>Coins</Text>
            </Pressable>
          </View>

          {/* Spent this week Card */}
          <View style={styles.spentCard}>
            <View style={styles.spentHeader}>
              <View>
                <Text style={styles.spentTitle}>Spent this week</Text>
                <Text style={styles.spentAmount}>₹1,275</Text>
              </View>
              <View style={styles.spentBadge}>
                <Text style={styles.spentBadgeText}>6 payments</Text>
              </View>
            </View>

            {/* Day Bar Chart */}
            <View style={styles.spentBarsRow}>
              {SPENT_BARS.map((bar, idx) => (
                <View key={idx} style={styles.spentBarCol}>
                  <View style={[styles.spentBarPill, { height: bar.h, backgroundColor: bar.bg }]} />
                  <Text style={styles.spentBarLabel}>{bar.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 2 Stats Cards (Due soon + Aura) */}
          <View style={styles.duoGrid}>
            {/* Due soon Black Card */}
            <Pressable onPress={() => router.push("/(student)/dues")} style={styles.dueCard}>
              <View style={styles.dueTopRow}>
                <Text style={styles.dueMeta}>Due soon</Text>
                <View style={styles.dueDaysBadge}>
                  <Text style={styles.dueDaysText}>5 days</Text>
                </View>
              </View>
              <View>
                <Text style={styles.dueAmount}>₹1,150</Text>
                <Text style={styles.dueDateText}>Due 12 Nov</Text>
              </View>
            </Pressable>

            {/* Aura Yellow Card */}
            <Pressable onPress={() => router.push("/(student)/aura")} style={styles.auraCard}>
              <View style={styles.auraTopRow}>
                <Text style={styles.auraMeta}>Aura</Text>
                <View style={styles.auraDeltaBadge}>
                  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 19V5M5 12l7-7 7 7" />
                  </Svg>
                  <Text style={styles.auraDeltaText}>4</Text>
                </View>
              </View>
              <View>
                <Text style={styles.auraScoreDisplay}>{s.aura}</Text>
                <Text style={styles.auraTierText}>Main Character</Text>
              </View>
            </Pressable>
          </View>

          {/* Recent Activity Section */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent</Text>
              <Pressable onPress={() => router.push("/(student)/activity")} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>See all</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 6l6 6-6 6" />
                </Svg>
              </Pressable>
            </View>

            <View style={styles.recentCard}>
              <Pressable onPress={() => router.push("/(student)/receipt")} style={styles.recentRow}>
                <View style={[styles.recentIconBox, { backgroundColor: "#FBF3C4" }]}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2" />
                  </Svg>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentVendorName}>Campus Cafe</Text>
                  <Text style={styles.recentTime}>Today</Text>
                </View>
                <Text style={styles.recentAmount}>₹125</Text>
              </Pressable>

              <View style={[styles.recentRow, styles.recentBorder]}>
                <View style={[styles.recentIconBox, { backgroundColor: "#F1EFE9" }]}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
                  </Svg>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentVendorName}>Xerox Corner</Text>
                  <Text style={styles.recentTime}>Yesterday</Text>
                </View>
                <Text style={styles.recentAmount}>₹35</Text>
              </View>
            </View>

            <Text style={styles.demoDisclaimer}>
              Demo: simulated data, no real money
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Floating Bottom Nav */}
      <BottomNav active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  headerGlow: {
    position: "absolute",
    left: "50%",
    top: 40,
    width: 420,
    height: 420,
    marginLeft: -210,
    borderRadius: 210,
    backgroundColor: "rgba(255,246,205,0.8)",
  },
  topBar: {
    paddingTop: 32,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: YELLOW,
    fontSize: 17,
    fontWeight: "800",
  },
  greetingWrap: {
    flex: 1,
    marginLeft: 4,
  },
  dateText: {
    fontSize: 13,
    color: "rgba(11,11,12,0.6)",
    fontWeight: "500",
  },
  greetingText: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: INK,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notifBtn: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: INK,
    borderWidth: 2,
    borderColor: "#F8E27A",
  },
  auraPill: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.55)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  auraText: {
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },
  spendSection: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  spendMeta: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(11,11,12,0.62)",
  },
  amountToggle: {
    marginTop: 6,
  },
  amountDisplay: {
    fontSize: 60,
    fontWeight: "800",
    letterSpacing: -2.5,
    lineHeight: 62,
    color: INK,
    marginLeft: -2,
  },
  limitBarWrap: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  limitTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(11,11,12,0.14)",
    overflow: "hidden",
  },
  limitFill: {
    width: "96%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: INK,
  },
  limitLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  limitText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 262,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: SHEET_BG,
    shadowColor: "rgba(120,90,0,0.45)",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 110,
  },
  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  quickCol: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  quickIconBox: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: INK,
  },
  spentCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  spentHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  spentTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B6B70",
  },
  spentAmount: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: INK,
  },
  spentBadge: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: "#FBF3C4",
    alignItems: "center",
    justifyContent: "center",
  },
  spentBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: INK,
  },
  spentBarsRow: {
    marginTop: 16,
    height: 104,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  spentBarCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    height: "100%",
  },
  spentBarPill: {
    width: "100%",
    borderRadius: 10,
  },
  spentBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A90",
  },
  duoGrid: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
  },
  dueCard: {
    flex: 1,
    height: 124,
    padding: 16,
    borderRadius: 26,
    backgroundColor: INK,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  dueTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dueMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },
  dueDaysBadge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  dueDaysText: {
    color: INK,
    fontSize: 11,
    fontWeight: "800",
  },
  dueAmount: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: "#FFFFFF",
  },
  dueDateText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  auraCard: {
    flex: 1,
    height: 124,
    padding: 16,
    borderRadius: 26,
    backgroundColor: YELLOW,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  auraTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  auraMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(11,11,12,0.62)",
  },
  auraDeltaBadge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.6)",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  auraDeltaText: {
    fontSize: 11,
    fontWeight: "800",
    color: INK,
  },
  auraScoreDisplay: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: INK,
  },
  auraTierText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(11,11,12,0.62)",
  },
  recentSection: {
    marginTop: 24,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },
  recentCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 24,
    paddingHorizontal: 16,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 62,
  },
  recentBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F1EFE9",
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: {
    flex: 1,
  },
  recentVendorName: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  recentTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  demoDisclaimer: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 16,
    color: "#8A8A90",
    textAlign: "center",
  },
});
