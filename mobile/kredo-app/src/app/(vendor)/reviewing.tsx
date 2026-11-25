import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function VendorReviewing() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <Glow style={styles.glow} />
      <View style={styles.sheetBg} />

      {/* Central Animation and Heading */}
      <View style={styles.centerSection}>
        <View style={styles.spinnerWrap}>
          {/* Outer ring */}
          <Svg width={176} height={176} viewBox="0 0 176 176" style={styles.spinnerSvg}>
            <Circle cx={88} cy={88} r={80} fill="none" stroke="#EFEDE6" strokeWidth={8} />
            <Path d="M88 8a80 80 0 0 1 80 80" fill="none" stroke="#E3CB4A" strokeWidth={8} strokeLinecap="round" />
          </Svg>
          {/* Inner Badge with 'C' */}
          <View style={styles.badgeBox}>
            <Text style={styles.badgeLetter}>C</Text>
          </View>
        </View>

        <Text style={styles.headingText}>Reviewing your stall...</Text>
        <Text style={styles.subText}>
          Our lending partner is checking your details. This usually takes under 2 working days.
        </Text>
      </View>

      {/* Status Timeline Card */}
      <View style={styles.timelineCard}>
        {/* Step 1: Details received */}
        <View style={styles.stepRow}>
          <View style={styles.stepDoneCircle}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7" />
            </Svg>
          </View>
          <Text style={styles.stepTitle}>Details received</Text>
          <Text style={styles.stepMeta}>Just now</Text>
        </View>

        {/* Step 2: Partner reviewing */}
        <View style={[styles.stepRow, styles.stepBorder]}>
          <View style={styles.stepProgressCircle}>
            <Svg width={28} height={28} viewBox="0 0 28 28">
              <Circle cx={14} cy={14} r={11} fill="none" stroke="#EFEDE6" strokeWidth={4} />
              <Path d="M14 3a11 11 0 0 1 11 11" fill="none" stroke="#E3CB4A" strokeWidth={4} strokeLinecap="round" />
            </Svg>
          </View>
          <Text style={styles.stepTitle}>Partner reviewing</Text>
          <Text style={styles.stepMeta}>In progress</Text>
        </View>

        {/* Step 3: Stall goes live */}
        <View style={[styles.stepRow, styles.stepBorder]}>
          <View style={styles.stepFutureCircle} />
          <Text style={[styles.stepTitle, { color: "#9A9AA0" }]}>Stall goes live</Text>
          <Text style={[styles.stepMeta, { color: "#9A9AA0" }]}>Next</Text>
        </View>
      </View>

      {/* Bottom Continue Button */}
      <View style={styles.bottomWrap}>
        <Pressable
          onPress={() => router.push("/(vendor)/live")}
          style={styles.continueBtn}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12h14M13 6l6 6-6 6" />
          </Svg>
        </Pressable>
      </View>
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
    top: 60,
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
  centerSection: {
    marginTop: 100,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  spinnerWrap: {
    width: 176,
    height: 176,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  spinnerSvg: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  badgeBox: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
  },
  badgeLetter: {
    color: "#F1DD6A",
    fontSize: 44,
    fontWeight: "800",
  },
  headingText: {
    marginTop: 32,
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -1,
    color: INK,
  },
  subText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#6B6B70",
    textAlign: "center",
    maxWidth: 280,
  },
  timelineCard: {
    marginHorizontal: 24,
    marginTop: 36,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 60,
  },
  stepBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F1EFE9",
  },
  stepDoneCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E3CB4A",
    alignItems: "center",
    justifyContent: "center",
  },
  stepProgressCircle: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  stepFutureCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ECEAE4",
  },
  stepTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  stepMeta: {
    fontSize: 12,
    color: "#6B6B70",
  },
  bottomWrap: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  continueBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
