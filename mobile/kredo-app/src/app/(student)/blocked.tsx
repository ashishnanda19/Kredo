import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path, Rect } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Blocked() {
  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <View style={s.radialGlow} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={s.topTitle}>Payments paused</Text>
        <View style={s.spacer44} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={s.heroSection}>
          <View style={s.pauseCircle}>
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Rect x="6" y="5" width="4" height="14" rx="1.6" />
              <Rect x="14" y="5" width="4" height="14" rx="1.6" />
            </Svg>
          </View>
          <Text style={s.heroTitle}>{"Paused for now.\nEasy to fix."}</Text>
          <Text style={s.heroSub}>
            You have ₹1,150 past its due date. Clear it and payments switch back on. No rush, no penalty beyond the late fee shown.
          </Text>
        </View>

        {/* Back to Normal Progress */}
        <View style={s.progressSection}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Back to normal</Text>
            <Text style={s.progressVal}>Aura 62 of 70 needed</Text>
          </View>
          <View style={s.progressBar}>
            <View style={s.progressFill} />
          </View>
        </View>

        {/* Action Steps Card */}
        <View style={s.card}>
          <View style={s.stepRow}>
            <View style={s.stepNum}>
              <Text style={s.stepNumText}>1</Text>
            </View>
            <View style={s.stepInfo}>
              <Text style={s.stepTitle}>Repay ₹1,150</Text>
              <Text style={s.stepSub}>Past due · 4 days late</Text>
            </View>
            <Pressable onPress={() => router.push("/(student)/repay")} style={s.actionPill}>
              <Text style={s.actionPillText}>Pay</Text>
            </Pressable>
          </View>

          <View style={s.divider} />

          <View style={s.stepRow}>
            <View style={s.stepNumMuted}>
              <Text style={s.stepNumMutedText}>2</Text>
            </View>
            <View style={s.stepInfo}>
              <Text style={s.stepTitleMuted}>Next due, 24 Nov</Text>
              <Text style={s.stepSub}>Upcoming on time</Text>
            </View>
          </View>
        </View>

        {/* Bottom CTA */}
        <Pressable onPress={() => router.push("/(student)/repay")} style={s.repayBtn}>
          <Text style={s.repayBtnText}>Repay ₹1,150 to unpause</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12h14M13 6l6 6-6 6" />
          </Svg>
        </Pressable>
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
    top: 92,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    textAlign: "center",
  },
  pauseCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FBF3C4",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    marginTop: 22,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 34,
    textAlign: "center",
    color: INK,
  },
  heroSub: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#6B6B70",
    textAlign: "center",
    maxWidth: 300,
  },
  progressSection: {
    marginTop: 26,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#6B6B70",
  },
  progressVal: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EAE7DF",
    overflow: "hidden",
  },
  progressFill: {
    width: "72%",
    height: "100%",
    backgroundColor: "#E3CB4A",
    borderRadius: 4,
  },
  card: {
    marginTop: 22,
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
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 76,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F1DD6A",
  },
  stepNumMuted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumMutedText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6B6B70",
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  stepTitleMuted: {
    fontSize: 15,
    fontWeight: "800",
    color: "#6B6B70",
  },
  stepSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  actionPill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: INK,
    justifyContent: "center",
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
  repayBtn: {
    marginTop: 28,
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  repayBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
