import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import { VendorNav } from "@/components/vendor-nav";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

type PayoutItem = {
  who: string;
  init: string;
  amt: string;
  paid: string;
  out: string;
  leftSeconds: number;
};

const INITIAL_DATA: PayoutItem[] = [
  { who: "Meera", init: "M", amt: "₹60", paid: "11:05 am", out: "11:05 pm", leftSeconds: 8 * 3600 + 12 * 60 + 33 },
  { who: "Aarav", init: "A", amt: "₹125", paid: "1:42 pm", out: "1:42 am", leftSeconds: 10 * 3600 + 49 * 60 + 33 },
];

export default function VendorSettle() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const cur = INITIAL_DATA[selectedIndex];
  const remaining = Math.max(0, cur.leftSeconds - elapsed);

  const pad = (n: number) => String(n).padStart(2, "0");
  const clockText = `${pad(Math.floor(remaining / 3600))}:${pad(Math.floor((remaining % 3600) / 60))}:${pad(remaining % 60)}`;
  const progressPct = Math.round(((43200 - remaining) / 43200) * 100);

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <Glow style={styles.glow} />
      <View style={styles.sheetBg} />

      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Payouts</Text>
        <View style={styles.bankBadge}>
          <Text style={styles.bankBadgeText}>Bank ••4821</Text>
        </View>
      </View>

      {/* Hero: Payout Countdown Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroLabel}>Payout for {cur.who} in</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <Text style={styles.clockDisplay}>{clockText}</Text>
        <Text style={styles.heroSub}>
          {cur.amt} from {cur.who}, paid at {cur.paid}. Lands at {cur.out}.
        </Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2 Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statMeta}>Awaiting payout</Text>
            <Text style={styles.statAmount}>₹185</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statMeta}>Paid yesterday</Text>
            <Text style={styles.statAmount}>₹480</Text>
          </View>
        </View>

        {/* Payouts List Card */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Payouts</Text>
          <View style={styles.listCard}>
            {INITIAL_DATA.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const rem = Math.max(0, item.leftSeconds - elapsed);
              const shortLeft = `${Math.floor(rem / 3600)}h ${pad(Math.floor((rem % 3600) / 60))}m`;

              return (
                <Pressable
                  key={item.who}
                  onPress={() => setSelectedIndex(idx)}
                  style={[
                    styles.itemRow,
                    isSelected ? styles.itemRowSelected : styles.itemRowUnselected,
                  ]}
                >
                  <View style={[styles.avatarBox, { backgroundColor: isSelected ? "#F1DD6A" : "#F1EFE9" }]}>
                    <Text style={styles.avatarText}>{item.init}</Text>
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.amt} from {item.who}</Text>
                    <Text style={styles.itemSubtitle}>Pays out {item.out}</Text>
                  </View>

                  <View style={[styles.timeChip, { backgroundColor: isSelected ? INK : "#FBF3C4" }]}>
                    <Text style={[styles.timeChipText, { color: isSelected ? YELLOW : INK }]}>
                      {shortLeft}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {/* Settled Yesterday Row */}
            <View style={styles.settledRow}>
              <View style={styles.settledIconBox}>
                <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
                </Svg>
              </View>
              <View style={styles.settledInfo}>
                <Text style={styles.settledTitle}>₹480 yesterday</Text>
                <Text style={styles.settledSubtitle}>5 payments</Text>
              </View>
              <View style={styles.settledBadge}>
                <Text style={styles.settledBadgeText}>Paid</Text>
              </View>
            </View>
          </View>

          <Text style={styles.disclaimerText}>
            Paid by the lending partner, 12 hours after each payment.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <VendorNav active="settle" />
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
    top: 249,
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
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: INK,
  },
  bankBadge: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  bankBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  heroCard: {
    paddingTop: 18,
    paddingHorizontal: 24,
    paddingBottom: 26,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: {
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
  clockDisplay: {
    marginTop: 16,
    fontSize: 54,
    lineHeight: 56,
    letterSpacing: -2.16,
    fontWeight: "800",
    color: INK,
    fontVariant: ["tabular-nums"],
  },
  heroSub: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(11,11,12,0.68)",
  },
  progressBarBg: {
    marginTop: 12,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(11,11,12,0.14)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: INK,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 110,
  },
  statsGrid: {
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
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  statMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B70",
  },
  statAmount: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: INK,
  },
  sectionWrap: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
    paddingBottom: 10,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 24,
    padding: 8,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 68,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginVertical: 2,
  },
  itemRowSelected: {
    backgroundColor: "#FBF3C4",
    borderWidth: 1.5,
    borderColor: "#E3CB4A",
  },
  itemRowUnselected: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  itemSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  timeChip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  settledRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1EFE9",
    marginTop: 4,
  },
  settledIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  settledInfo: {
    flex: 1,
  },
  settledTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  settledSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  settledBadge: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#E3F2E8",
    alignItems: "center",
    justifyContent: "center",
  },
  settledBadgeText: {
    color: "#1B6B3A",
    fontSize: 12,
    fontWeight: "800",
  },
  disclaimerText: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B70",
    textAlign: "center",
  },
});
