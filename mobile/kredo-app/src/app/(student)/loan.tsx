import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { useState, useRef } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import Svg, { Path } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Loan() {
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<any>(null);

  const handleDownload = () => {
    setSaved(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSaved(false), 2400);
  };

  const items = [
    { name: "Stationery Hub", when: "2 Nov", amt: "₹320" },
    { name: "Campus Cafe", when: "3 Nov", amt: "₹210" },
    { name: "Juice Point", when: "4 Nov", amt: "₹175" },
    { name: "Xerox Corner", when: "5 Nov", amt: "₹95" },
    { name: "Campus Cafe", when: "5 Nov", amt: "₹180" },
    { name: "Campus Cafe", when: "6 Nov", amt: "₹170" },
  ];

  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <Glow style={s.radialGlow} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.circleBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={s.topTitle}>Coins due</Text>
        <Pressable onPress={handleDownload} style={s.circleBtn}>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
          </Svg>
        </Pressable>
      </View>

      {/* Toast Alert */}
      {saved && (
        <View style={s.toast}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12.5l4.5 4.5L19 7" />
          </Svg>
          <Text style={s.toastText}>Statement saved as PDF</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Due Hero */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <Text style={s.heroDate}>Due 12 Nov</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>Upcoming · 5 days</Text>
            </View>
          </View>
          <Text style={s.heroAmount}>₹1,150</Text>
          <View style={s.trackBar}>
            <View style={s.fillBar} />
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaText}>Repaid ₹0</Text>
            <Text style={s.metaText}>6 payments</Text>
          </View>
        </View>

        {/* What this covers */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>What this covers</Text>
          <View style={s.detailsCard}>
            <View style={s.detailRow}>
              <Text style={s.rowLabel}>Spent at campus vendors</Text>
              <Text style={s.rowVal}>₹1,120</Text>
            </View>
            <View style={s.divider} />
            <View style={s.detailRow}>
              <Text style={s.rowLabel}>Fees (₹5 each)</Text>
              <Text style={s.rowVal}>₹30</Text>
            </View>
            <View style={s.divider} />
            <View style={s.detailRow}>
              <Text style={s.rowLabel}>Interest</Text>
              <Text style={s.rowVal}>₹0</Text>
            </View>
            <View style={s.divider} />
            <View style={s.detailRow}>
              <Text style={s.totalLabel}>Total to repay</Text>
              <Text style={s.totalVal}>₹1,150</Text>
            </View>
          </View>
        </View>

        {/* Payments List */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>Payments in this repayment</Text>
          <View style={s.detailsCard}>
            {items.map((it, idx) => (
              <View key={idx}>
                <Pressable onPress={() => router.push("/(student)/receipt")} style={s.itemRow}>
                  <View style={s.itemInfo}>
                    <Text style={s.itemTitle}>{it.name}</Text>
                    <Text style={s.itemWhen}>{it.when}</Text>
                  </View>
                  <Text style={s.itemAmt}>{it.amt}</Text>
                </Pressable>
                {idx < items.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        </View>

        <Text style={s.disclaimer}>
          You repay our lending partner, not Kredo. Late repayments can lower your Aura and limit.
        </Text>

      </ScrollView>

      {/* Pinned like the design: fades the list out under the button */}
      <View style={s.bottomBar}>
        <LinearGradient colors={["rgba(250,249,246,0)", "#FAF9F6", "#FAF9F6"]} locations={[0, 0.36, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <Pressable onPress={() => router.push("/(student)/repay")} style={s.repayBtn}>
        <Text style={s.repayBtnText}>Repay ₹1,150</Text>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 12h14M13 6l6 6-6 6" />
        </Svg>
      </Pressable>
      </View>
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
    top: 273,
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
  toast: {
    position: "absolute",
    top: 92,
    alignSelf: "center",
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 130,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 26,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  heroCard: {
    paddingTop: 22,
    paddingHorizontal: 24,
    paddingBottom: 26,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(11,11,12,0.62)",
  },
  badge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: INK,
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F5D832",
  },
  heroAmount: {
    marginTop: 8,
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -2.86,
    lineHeight: 54,
    marginLeft: -2,
    color: INK,
  },
  trackBar: {
    marginTop: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(11,11,12,0.14)",
    overflow: "hidden",
  },
  fillBar: {
    width: 0,
    height: "100%",
    backgroundColor: INK,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(11,11,12,0.62)",
  },
  sectionWrap: {
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(11,11,12,0.62)",
    paddingBottom: 8,
  },
  detailsCard: {
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
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
  },
  rowLabel: {
    fontSize: 14,
    color: "rgba(11,11,12,0.62)",
  },
  rowVal: {
    fontSize: 14,
    fontWeight: "700",
    color: INK,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  totalVal: {
    fontSize: 17,
    fontWeight: "800",
    color: INK,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 56,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: INK,
  },
  itemWhen: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(11,11,12,0.62)",
    marginTop: 2,
  },
  itemAmt: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(11,11,12,0.62)",
    textAlign: "center",
  },
  repayBtn: {
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
