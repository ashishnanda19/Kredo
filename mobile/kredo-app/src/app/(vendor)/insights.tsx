import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { VendorNav } from "@/components/vendor-nav";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

const WEEK_DATA: [string, number][] = [
  ["M", 70],
  ["T", 95],
  ["W", 60],
  ["T", 120],
  ["F", 140],
  ["S", 80],
  ["S", 185],
];

const DAY_DATA: [string, number][] = [
  ["9", 15],
  ["10", 30],
  ["11", 60],
  ["12", 85],
  ["1", 125],
  ["2", 70],
  ["3", 40],
];

export default function VendorInsights() {
  const [isDay, setIsDay] = useState(false);

  const data = isDay ? DAY_DATA : WEEK_DATA;
  const maxVal = Math.max(...data.map((d) => d[1]));
  const total = data.reduce((acc, d) => acc + d[1], 0);
  const count = isDay ? 2 : 14;
  const avg = Math.round(total / count);

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <View style={styles.glow} />
      <View style={styles.sheetBg} />

      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Insights</Text>
      </View>

      {/* Segment Switcher */}
      <View style={styles.segmentWrap}>
        <View style={styles.segmentBox}>
          <Pressable
            onPress={() => setIsDay(false)}
            style={[styles.segmentBtn, !isDay && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, !isDay ? styles.segmentTextActive : styles.segmentTextInactive]}>
              This week
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsDay(true)}
            style={[styles.segmentBtn, isDay && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, isDay ? styles.segmentTextActive : styles.segmentTextInactive]}>
              Today
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Chart Card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartLabel}>
            {isDay ? "Received today" : "Received this week"}
          </Text>

          <View style={styles.amountDeltaRow}>
            <Text style={styles.totalAmount}>₹{total.toLocaleString("en-IN")}</Text>
            <View style={styles.deltaBadge}>
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 19V5M5 12l7-7 7 7" />
              </Svg>
              <Text style={styles.deltaText}>{isDay ? "8%" : "12%"}</Text>
            </View>
          </View>

          {/* Bar Chart Columns */}
          <View style={styles.barsContainer}>
            {data.map(([label, val], idx) => {
              const isMax = val === maxVal;
              const barHeightPct = Math.max(12, Math.round((val / maxVal) * 100));

              return (
                <View key={idx} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barPill,
                        {
                          height: `${barHeightPct}%`,
                          backgroundColor: isMax ? "#E3CB4A" : "#ECE9DF",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 2 Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statMeta}>Payments</Text>
            <Text style={styles.statNumber}>{count}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statMeta}>Average</Text>
            <Text style={styles.statNumber}>₹{avg}</Text>
          </View>
        </View>

        {/* Busiest Time Card */}
        <View style={styles.busiestCard}>
          <View style={styles.busiestTopRow}>
            <Text style={styles.busiestTitle}>Busiest time</Text>
            <Text style={styles.busiestTime}>1 pm to 2 pm</Text>
          </View>
          <View style={styles.busiestProgressBg}>
            <View style={styles.busiestProgressFill} />
          </View>
          <Text style={styles.busiestNote}>
            Most students pay around lunch. Keep your QR easy to reach then.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <VendorNav active="insights" />
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
    top: 92,
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
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: INK,
  },
  segmentWrap: {
    paddingTop: 18,
    paddingHorizontal: 24,
  },
  segmentBox: {
    height: 48,
    padding: 4,
    borderRadius: 24,
    backgroundColor: "#EFEDE6",
    flexDirection: "row",
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: INK,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  segmentTextInactive: {
    color: "#6B6B70",
  },
  scrollArea: {
    flex: 1,
    marginTop: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  chartCard: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  chartLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B6B70",
  },
  amountDeltaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  totalAmount: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.5,
    color: INK,
  },
  deltaBadge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  deltaText: {
    color: "#1B6B3A",
    fontSize: 11,
    fontWeight: "800",
  },
  barsContainer: {
    marginTop: 18,
    height: 130,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  barColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  barTrack: {
    width: "100%",
    height: 104,
    justifyContent: "flex-end",
  },
  barPill: {
    width: "100%",
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B6B70",
  },
  statsGrid: {
    marginTop: 14,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  statMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B70",
  },
  statNumber: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: INK,
  },
  busiestCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  busiestTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  busiestTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  busiestTime: {
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },
  busiestProgressBg: {
    marginTop: 12,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EAE7DF",
    overflow: "hidden",
  },
  busiestProgressFill: {
    width: "72%",
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#E3CB4A",
  },
  busiestNote: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: "#6B6B70",
  },
});
