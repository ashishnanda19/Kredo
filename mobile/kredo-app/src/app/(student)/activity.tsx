import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Activity() {
  const [filter, setFilter] = useState("all");

  const chips = [
    { id: "all", label: "All", count: "6" },
    { id: "cafe", label: "Campus Cafe", count: "3" },
    { id: "lib", label: "Library", count: "2" },
    { id: "nescafe", label: "Nescafe", count: "1" },
  ];

  const rows = [
    { id: "1", title: "Campus Cafe", sub: "Sat 7 Nov, 1:42 pm", amt: "₹120", status: "Paid" },
    { id: "2", title: "Library Xerox", sub: "Fri 6 Nov, 11:15 am", amt: "₹45", status: "Paid" },
    { id: "3", title: "Campus Cafe", sub: "Wed 4 Nov, 4:10 pm", amt: "₹85", status: "Paid" },
    { id: "4", title: "Nescafe Kiosk", sub: "Mon 2 Nov, 9:30 am", amt: "₹60", status: "Paid" },
    { id: "5", title: "Campus Cafe", sub: "Sat 31 Oct, 2:05 pm", amt: "₹110", status: "Paid" },
    { id: "6", title: "Library Xerox", sub: "Thu 29 Oct, 3:40 pm", amt: "₹30", status: "Paid" },
  ];

  const filteredRows =
    filter === "all"
      ? rows
      : filter === "cafe"
      ? rows.filter((r) => r.title.includes("Cafe"))
      : filter === "lib"
      ? rows.filter((r) => r.title.includes("Library"))
      : rows.filter((r) => r.title.includes("Nescafe"));

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
        <Text style={s.topTitle}>Activity</Text>
        <View style={s.spacer44} />
      </View>

      {/* Hero */}
      <View style={s.heroSection}>
        <Text style={s.heroLabel}>Spent this month</Text>
        <Text style={s.heroTotal}>₹1,275</Text>
      </View>

      {/* Filter Chips Horizontal Scroll */}
      <View style={s.chipScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {chips.map((c) => {
            const active = filter === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setFilter(c.id)}
                style={[s.chip, active ? s.chipActive : s.chipInactive]}
              >
                <Text style={[s.chipLabel, active ? s.chipLabelActive : s.chipLabelInactive]}>
                  {c.label}
                </Text>
                <View style={[s.countBadge, active ? s.countBadgeActive : s.countBadgeInactive]}>
                  <Text style={[s.countText, active ? s.countTextActive : s.countTextInactive]}>
                    {c.count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.listCard}>
          {filteredRows.map((r, idx) => (
            <View key={r.id}>
              <Pressable
                onPress={() => router.push("/(student)/receipt")}
                style={s.rowItem}
              >
                <View style={s.itemIcon}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2" />
                  </Svg>
                </View>
                <View style={s.itemInfo}>
                  <Text style={s.itemTitle}>{r.title}</Text>
                  <Text style={s.itemSub}>{r.sub}</Text>
                </View>
                <Text style={s.itemAmt}>{r.amt}</Text>
              </Pressable>
              {idx < filteredRows.length - 1 && <View style={s.divider} />}
            </View>
          ))}
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
    top: 191,
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
    paddingBottom: 16,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(11,11,12,0.62)",
  },
  heroTotal: {
    marginTop: 4,
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -2,
    color: INK,
  },
  chipScrollWrap: {
    paddingVertical: 12,
  },
  chipRow: {
    paddingHorizontal: 24,
    gap: 8,
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipActive: {
    backgroundColor: INK,
  },
  chipInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  chipLabelActive: {
    color: "#FFFFFF",
  },
  chipLabelInactive: {
    color: INK,
  },
  countBadge: {
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  countBadgeInactive: {
    backgroundColor: "#F1EFE9",
  },
  countText: {
    fontSize: 11,
    fontWeight: "800",
  },
  countTextActive: {
    color: "#FFFFFF",
  },
  countTextInactive: {
    color: INK,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 36,
  },
  listCard: {
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
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 68,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  itemSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  itemAmt: {
    fontSize: 16,
    fontWeight: "800",
    color: INK,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
});
