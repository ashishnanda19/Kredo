import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import Svg, { Path } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Limit() {
  const levels = [
    { n: "L1", amt: "₹1,000", note: "Starting limit", st: "done" },
    { n: "L2", amt: "₹2,000", note: "After 1 on-time repayment", st: "done" },
    { n: "L3", amt: "₹3,000", note: "After 2 on time in a row", st: "now" },
    { n: "L4", amt: "₹5,000", note: "Next: 3 on time in a row", st: "next" },
    { n: "L5", amt: "₹7,500", note: "After 6 on time", st: "next" },
    { n: "L6", amt: "₹10,000", note: "After 10 on time", st: "next" },
  ];

  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <Glow style={s.radialGlow} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={s.topTitle}>Your limit</Text>
        <View style={s.spacer44} />
      </View>

      {/* Hero */}
      <View style={s.heroSection}>
        <Text style={s.heroLabel}>Current limit · Level 3</Text>
        <Text style={s.heroAmount}>₹3,000</Text>
        <View style={s.progressRow}>
          <View style={s.progressTrack}>
            <View style={s.progressFill} />
          </View>
          <Text style={s.progressLabel}>2 of 3 on time</Text>
        </View>
        <Text style={s.heroSub}>
          One more on-time repayment moves you to ₹5,000. Set by our lending partner.
        </Text>
      </View>

      {/* The Ladder */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionHeader}>The ladder</Text>
        <View style={s.ladderList}>
          {/* Vertical Track lines */}
          <View style={s.ladderLine} />
          <View style={s.ladderLineActive} />

          {levels.map((l, idx) => {
            const isNow = l.st === "now";
            const isDone = l.st === "done";

            return (
              <View key={idx} style={s.stepRow}>
                <View
                  style={[
                    s.stepBadge,
                    isNow ? s.stepBadgeNow : isDone ? s.stepBadgeDone : s.stepBadgeNext,
                  ]}
                >
                  <Text
                    style={[
                      s.stepBadgeText,
                      isNow ? s.stepTextNow : isDone ? s.stepTextDone : s.stepTextNext,
                    ]}
                  >
                    {l.n}
                  </Text>
                </View>

                <View style={s.stepInfo}>
                  <Text
                    style={[
                      s.stepAmt,
                      l.st === "next" ? s.stepAmtMuted : s.stepAmtInk,
                    ]}
                  >
                    {l.amt}
                  </Text>
                  <Text style={s.stepNote}>{l.note}</Text>
                </View>

                {isNow && (
                  <View style={s.herePill}>
                    <Text style={s.herePillText}>You are here</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={s.bannerCard}>
          <Text style={s.bannerText}>
            Limits only move on how you repay. Late or missed repayments can lower your limit, always with a reason.
          </Text>
        </View>
      </ScrollView>
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
    top: 286,
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
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: INK,
  },
  spacer44: {
    width: 44,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(11,11,12,0.62)",
  },
  heroAmount: {
    marginTop: 6,
    fontSize: 60,
    fontWeight: "800",
    letterSpacing: -2.5,
    lineHeight: 62,
    color: INK,
  },
  progressRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(11,11,12,0.14)",
    overflow: "hidden",
  },
  progressFill: {
    width: "66%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: INK,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(11,11,12,0.62)",
  },
  heroSub: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(11,11,12,0.62)",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 36,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#6B6B70",
    paddingBottom: 12,
  },
  ladderList: {
    position: "relative",
    gap: 8,
  },
  ladderLine: {
    position: "absolute",
    left: 19,
    top: 24,
    bottom: 24,
    width: 3,
    backgroundColor: "#EAE7DF",
    borderRadius: 2,
  },
  ladderLineActive: {
    position: "absolute",
    left: 19,
    top: 24,
    height: 160,
    width: 3,
    backgroundColor: "#E3CB4A",
    borderRadius: 2,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 64,
  },
  stepBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FAF9F6",
  },
  stepBadgeNow: {
    backgroundColor: INK,
  },
  stepBadgeDone: {
    backgroundColor: "#E3CB4A",
  },
  stepBadgeNext: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D9D6CC",
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  stepTextNow: {
    color: "#F1DD6A",
  },
  stepTextDone: {
    color: INK,
  },
  stepTextNext: {
    color: "#6B6B70",
  },
  stepInfo: {
    flex: 1,
  },
  stepAmt: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  stepAmtInk: {
    color: INK,
  },
  stepAmtMuted: {
    color: "#9A9AA0",
  },
  stepNote: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B70",
    marginTop: 2,
  },
  herePill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: INK,
    justifyContent: "center",
  },
  herePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bannerCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FBF3C4",
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: INK,
  },
});
