import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path, Circle } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Receipt() {
  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <View style={s.radialGlow} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.replace("/(student)/home")} style={s.circleBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={s.topTitle}>Receipt</Text>
        <Pressable style={s.circleBtn}>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stall & Amount Header */}
        <View style={s.headerCard}>
          <View style={s.stallRow}>
            <View style={s.stallIcon}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2" />
              </Svg>
            </View>
            <View style={s.stallInfo}>
              <Text style={s.stallName}>Campus Cafe</Text>
              <Text style={s.stallTime}>Sat 7 Nov, 1:42 pm</Text>
            </View>
          </View>
          <Text style={s.amount}>₹125</Text>
          <View style={s.matchedBadge}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7" />
            </Svg>
            <Text style={s.matchedText}>Matched with lender records</Text>
          </View>
        </View>

        {/* Breakdown Card */}
        <View style={s.detailsCard}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Amount</Text>
            <Text style={s.rowVal}>₹120</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Fee</Text>
            <Text style={s.rowVal}>₹5</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Repay by</Text>
            <Text style={s.rowVal}>7 Dec</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Method</Text>
            <Text style={s.rowVal}>Kredo card ••0042</Text>
          </View>
        </View>

        {/* What Happens Next Card */}
        <View style={s.timelineCard}>
          <Text style={s.timelineTitle}>What happens next</Text>
          <View style={s.timelineList}>
            {/* Timeline track line */}
            <View style={s.trackLine} />
            <View style={s.trackLineActive} />

            {/* Step 1 */}
            <View style={s.timelineItem}>
              <View style={s.stepIconActive}>
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12.5l4.5 4.5L19 7" />
                </Svg>
              </View>
              <Text style={s.timelineText}>
                <Text style={s.bold}>Today </Text>
                <Text style={s.muted}>Campus Cafe is told you paid</Text>
              </Text>
            </View>

            {/* Step 2 */}
            <View style={s.timelineItem}>
              <View style={s.stepIconCurrent}>
                <View style={s.currentDot} />
              </View>
              <Text style={s.timelineText}>
                <Text style={s.bold}>In 12 hours </Text>
                <Text style={s.muted}>Partner pays the stall</Text>
              </Text>
            </View>

            {/* Step 3 */}
            <View style={s.timelineItem}>
              <View style={s.stepIconPending} />
              <Text style={s.timelineText}>
                <Text style={s.bold}>7 Dec </Text>
                <Text style={s.muted}>You repay the lending partner</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={s.bottomCta}>
          <Pressable style={s.shareBtn}>
            <Text style={s.shareBtnText}>Share receipt</Text>
          </Pressable>
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
    top: 278,
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
  circleBtn: {
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
  scrollContent: {
    paddingBottom: 40,
  },
  headerCard: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
  },
  stallRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stallIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stallInfo: {
    flex: 1,
  },
  stallName: {
    fontSize: 16,
    fontWeight: "800",
    color: INK,
  },
  stallTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(11,11,12,0.62)",
    marginTop: 2,
  },
  amount: {
    marginTop: 18,
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -2.5,
    lineHeight: 58,
    color: INK,
  },
  matchedBadge: {
    marginTop: 12,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  matchedText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1B6B3A",
  },
  detailsCard: {
    marginHorizontal: 24,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
  },
  rowLabel: {
    fontSize: 14,
    color: "#6B6B70",
  },
  rowVal: {
    fontSize: 14,
    fontWeight: "700",
    color: INK,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
  timelineCard: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#6B6B70",
  },
  timelineList: {
    position: "relative",
    marginTop: 16,
    gap: 16,
  },
  trackLine: {
    position: "absolute",
    left: 9,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: "#ECEAE4",
  },
  trackLineActive: {
    position: "absolute",
    left: 9,
    top: 10,
    height: 36,
    width: 2,
    backgroundColor: "#E3CB4A",
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stepIconActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E3CB4A",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconCurrent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 5,
    borderColor: "#E3CB4A",
  },
  currentDot: {
    flex: 1,
  },
  stepIconPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#ECEAE4",
  },
  timelineText: {
    fontSize: 14,
    color: INK,
  },
  bold: {
    fontWeight: "700",
  },
  muted: {
    color: "#6B6B70",
  },
  bottomCta: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  shareBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  shareBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
