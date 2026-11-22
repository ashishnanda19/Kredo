import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path } from "react-native-svg";
import { BottomNav } from "@/components/bottom-nav";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Passport() {
  const milestones = [
    { title: "First on-time repayment", date: "Aug 2026" },
    { title: "Limit raised to ₹3,000", date: "Sep 2026" },
    { title: "3 on time in a row", date: "Oct 2026" },
  ];

  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <View style={s.radialGlow} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <Text style={s.topTitle}>Passport</Text>
        <Pressable style={s.shareBtn}>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={s.heroSection}>
          <Text style={s.heroSub}>Credit Passport · since Aug 2026</Text>
          <View style={s.heroRow}>
            <Text style={s.countNum}>14</Text>
            <Text style={s.countLabel}>{"on-time\nrepayments"}</Text>
          </View>
        </View>

        {/* 2 Stats Cards */}
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Repaid in total</Text>
            <Text style={s.statVal}>₹4,250</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Current limit</Text>
            <Text style={s.statVal}>₹3,000</Text>
          </View>
        </View>

        {/* Milestones Card */}
        <View style={s.milestoneSection}>
          <Text style={s.sectionHeader}>Milestones</Text>
          <View style={s.milestonesCard}>
            {milestones.map((m, idx) => (
              <View key={idx}>
                <View style={s.milestoneRow}>
                  <View style={s.milestoneDot}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />
                    </Svg>
                  </View>
                  <Text style={s.milestoneTitle}>{m.title}</Text>
                  <Text style={s.milestoneDate}>{m.date}</Text>
                </View>
                {idx < milestones.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
          <Text style={s.disclaimer}>Internal score, not a credit bureau score.</Text>
        </View>
      </ScrollView>

      {/* Persistent Bottom Nav */}
      <BottomNav active="passport" />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  sheetBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 227,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: SHEET,
  },
  radialGlow: {
    position: "absolute",
    left: "50%",
    top: -60,
    width: 460,
    height: 300,
    marginLeft: -230,
    borderRadius: 230,
    backgroundColor: "rgba(255,246,205,0.75)",
  },
  topBar: {
    paddingTop: 32,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  topTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
    color: INK,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  heroSub: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(11,11,12,0.62)",
  },
  heroRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  countNum: {
    fontSize: 76,
    fontWeight: "800",
    letterSpacing: -4,
    lineHeight: 78,
    color: INK,
  },
  countLabel: {
    paddingBottom: 10,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 20,
    color: INK,
  },
  statsGrid: {
    paddingHorizontal: 24,
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B70",
  },
  statVal: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: INK,
  },
  milestoneSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
    paddingBottom: 10,
  },
  milestonesCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
  },
  milestoneDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1DD6A",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: INK,
  },
  milestoneDate: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B70",
    textAlign: "center",
  },
});
