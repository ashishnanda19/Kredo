import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import { VendorNav } from "@/components/vendor-nav";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function VendorToday() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [rec, setRec] = useState(0);

  useEffect(() => {
    // Count up animation to 185
    const start = Date.now();
    const duration = 1000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const val = 1 - Math.pow(1 - progress, 3);
      setRec(Math.round(185 * val));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <Glow style={styles.glow} />
      <View style={styles.sheetBg} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.push("/(vendor)/profile")} style={styles.stallAvatar}>
          <Text style={styles.stallAvatarText}>C</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>Your stall</Text>
          <Text style={styles.headerTitle}>Campus Cafe</Text>
        </View>
        <Pressable
          onPress={() => setIsOpen(!isOpen)}
          style={styles.openToggleBtn}
        >
          <Text style={styles.openToggleLabel}>{isOpen ? "Open" : "Closed"}</Text>
          <View style={[styles.switchTrack, { backgroundColor: isOpen ? "#2E9B57" : "#CFCBC0" }]}>
            <View style={[styles.switchKnob, { left: isOpen ? 19 : 3 }]} />
          </View>
        </Pressable>
      </View>

      {/* Hero: Received Today */}
      <View style={styles.heroSection}>
        {/* Sparkline decorative SVG */}
        <Svg width={190} height={80} viewBox="0 0 190 80" style={styles.sparkSvg}>
          <Path d="M4 66 C24 64 34 50 56 52 S92 30 112 34 S150 12 184 10" fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" opacity={0.75} />
          <Circle cx={184} cy={10} r={5} fill={INK} />
        </Svg>

        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>Received today</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <Text style={styles.heroAmount}>₹{rec}</Text>
        <Text style={styles.heroSub}>2 payments · last at 1:42 pm</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 Action Buttons Grid */}
        <View style={styles.actionsGrid}>
          <Pressable onPress={() => router.push("/(vendor)/payments")} style={styles.actionCol}>
            <View style={styles.actionIconBox}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 6h16M4 12h16M4 18h10" />
              </Svg>
            </View>
            <Text style={styles.actionLabel}>Payments</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(vendor)/settle")} style={styles.actionCol}>
            <View style={styles.actionIconBox}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="9" />
                <Path d="M12 8v4l3 2" />
              </Svg>
            </View>
            <Text style={styles.actionLabel}>Payouts</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(vendor)/payments")} style={styles.actionCol}>
            <View style={styles.actionIconBox}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
              </Svg>
            </View>
            <Text style={styles.actionLabel}>Refunds</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(vendor)/insights")} style={styles.actionCol}>
            <View style={styles.actionIconBox}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 20V10M12 20V4M19 20v-7" />
              </Svg>
            </View>
            <Text style={styles.actionLabel}>Insights</Text>
          </Pressable>
        </View>

        {/* 2 Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Awaiting payout */}
          <Pressable onPress={() => router.push("/(vendor)/settle")} style={styles.statCard}>
            <Text style={styles.statMeta}>Awaiting payout</Text>
            <View>
              <Text style={styles.statAmount}>₹185</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </Pressable>

          {/* Yesterday */}
          <Pressable onPress={() => router.push("/(vendor)/settle")} style={styles.statCard}>
            <View style={styles.statTopRow}>
              <Text style={styles.statMeta}>Yesterday</Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>Paid</Text>
              </View>
            </View>
            <View>
              <Text style={styles.statAmount}>₹480</Text>
              <Text style={styles.statSubText}>5 payments</Text>
            </View>
          </Pressable>
        </View>

        {/* Recent Payments Card */}
        <View style={styles.paymentsSection}>
          <View style={styles.paymentsHeader}>
            <Text style={styles.paymentsTitle}>Payments</Text>
            <Text style={styles.paymentsTime}>Today</Text>
          </View>
          <View style={styles.paymentsCard}>
            {/* Payment 1 */}
            <Pressable onPress={() => router.push("/(vendor)/received")} style={styles.paymentRow}>
              <View style={[styles.paymentAvatar, { backgroundColor: "#F1DD6A" }]}>
                <Text style={styles.paymentAvatarText}>A</Text>
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>Aarav</Text>
                <Text style={styles.paymentTimestamp}>1:42 pm</Text>
              </View>
              <Text style={styles.paymentAmount}>+₹125</Text>
            </Pressable>

            {/* Payment 2 */}
            <View style={[styles.paymentRow, styles.paymentBorder]}>
              <View style={[styles.paymentAvatar, { backgroundColor: "#F1EFE9" }]}>
                <Text style={styles.paymentAvatarText}>M</Text>
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>Meera</Text>
                <Text style={styles.paymentTimestamp}>11:05 am</Text>
              </View>
              <Text style={styles.paymentAmount}>+₹60</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <VendorNav active="today" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  glow: {
    position: "absolute",
    left: "50%",
    top: -60,
    width: 460,
    height: 300,
    marginLeft: -230,
    borderRadius: 230,
    backgroundColor: "rgba(255,246,205,0.75)",
  },
  sheetBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 236,
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
  headerBar: {
    paddingTop: 32,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stallAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: INK,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  stallAvatarText: {
    color: "#F1DD6A",
    fontSize: 18,
    fontWeight: "800",
  },
  headerInfo: {
    flex: 1,
  },
  headerSub: {
    fontSize: 13,
    color: "#6B6B70",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: INK,
  },
  openToggleBtn: {
    height: 36,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  openToggleLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },
  switchTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    position: "relative",
  },
  switchKnob: {
    position: "absolute",
    top: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  heroSection: {
    paddingTop: 18,
    paddingHorizontal: 24,
    paddingBottom: 26,
    position: "relative",
  },
  sparkSvg: {
    position: "absolute",
    right: 18,
    bottom: 24,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroMeta: {
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: INK,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  heroAmount: {
    marginTop: 14,
    fontSize: 56,
    lineHeight: 58,
    letterSpacing: -2.8,
    fontWeight: "800",
    color: INK,
  },
  heroSub: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(11,11,12,0.65)",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionCol: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
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
  actionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  statsGrid: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    height: 108,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "space-between",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B6B70",
  },
  paidBadge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: "#E3F2E8",
    alignItems: "center",
    justifyContent: "center",
  },
  paidBadgeText: {
    color: "#1B6B3A",
    fontSize: 11,
    fontWeight: "800",
  },
  statAmount: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: INK,
  },
  statSubText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B70",
  },
  progressBar: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EFEDE6",
    overflow: "hidden",
  },
  progressFill: {
    width: "62%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#E3CB4A",
  },
  paymentsSection: {
    marginTop: 22,
  },
  paymentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  paymentsTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
  },
  paymentsTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B6B70",
  },
  paymentsCard: {
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
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 62,
  },
  paymentBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F1EFE9",
  },
  paymentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentAvatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  paymentTimestamp: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
});
