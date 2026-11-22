import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path, Circle } from "react-native-svg";
import { BottomNav } from "@/components/bottom-nav";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Aura() {
  const reasons = [
    { change: "+4", title: "Repaid on time", sub: "12 Nov" },
    { change: "+2", title: "On-time streak", sub: "3 in a row" },
    { change: "+5", title: "Verified student", sub: "College ID checked" },
  ];

  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <View style={s.radialGlow} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <Text style={s.topTitle}>Aura</Text>
        <View style={s.monthBadge}>
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 19V5M5 12l7-7 7 7" />
          </Svg>
          <Text style={s.monthBadgeText}>+4 this month</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ring Hero */}
        <View style={s.heroSection}>
          <View style={s.ringWrap}>
            <View style={s.glowBehind} />
            <Svg width={220} height={220} viewBox="0 0 220 220">
              <Circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={14} />
              <Circle
                cx="110"
                cy="110"
                r="90"
                fill="none"
                stroke={INK}
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray="565.5"
                strokeDashoffset="101.8"
                rotation="-90"
                origin="110, 110"
              />
            </Svg>
            <View style={s.ringCenter}>
              <Text style={s.scoreNum}>82</Text>
              <Text style={s.scoreSub}>out of 100</Text>
            </View>
          </View>
          <Text style={s.tierTitle}>Main Character</Text>
        </View>

        {/* Why it changed Section */}
        <View style={s.whySection}>
          <View style={s.whyHeader}>
            <Text style={s.whyTitle}>Why it changed</Text>
            <Pressable onPress={() => router.push("/(student)/quests")} style={s.questsBtn}>
              <Text style={s.questsBtnText}>Quests</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
            </Pressable>
          </View>

          <View style={s.reasonsCard}>
            {reasons.map((r, idx) => (
              <View key={idx}>
                <View style={s.reasonRow}>
                  <View style={s.badgePill}>
                    <Text style={s.badgePillText}>{r.change}</Text>
                  </View>
                  <View style={s.reasonInfo}>
                    <Text style={s.reasonTitle}>{r.title}</Text>
                    <Text style={s.reasonSub}>{r.sub}</Text>
                  </View>
                </View>
                {idx < reasons.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>

          <Text style={s.disclaimer}>
            Aura only looks at how you repay. Internal score, not a credit bureau score.
          </Text>
        </View>
      </ScrollView>

      {/* Persistent Bottom Nav */}
      <BottomNav active="aura" />
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
    top: 388,
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
  monthBadge: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1B6B3A",
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroSection: {
    marginTop: 18,
    alignItems: "center",
  },
  ringWrap: {
    width: 220,
    height: 220,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  glowBehind: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(241,221,106,0.35)",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: {
    fontSize: 76,
    fontWeight: "800",
    letterSpacing: -4,
    lineHeight: 78,
    color: INK,
  },
  scoreSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(11,11,12,0.62)",
  },
  tierTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: INK,
  },
  whySection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  whyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  whyTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
  },
  questsBtn: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  questsBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  reasonsCard: {
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
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 62,
  },
  badgePill: {
    width: 48,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1DD6A",
    alignItems: "center",
    justifyContent: "center",
  },
  badgePillText: {
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },
  reasonInfo: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: INK,
  },
  reasonSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
  disclaimer: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B70",
    textAlign: "center",
  },
});
