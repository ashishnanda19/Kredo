import { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Rise, Pop } from "@/components/motion";
import { Screen, TopBar, Card, C, k } from "@/components/kit";

// Matches the Claude Design artboard "Activity" (Activity.dc.html).

const ICONS = {
  cafe: "M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2",
  xerox: "M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z",
  pen: "M5 19l1-4L16 5l3 3L9 18zM14 7l3 3",
};

type Status = "Upcoming" | "Paid" | "Overdue";
const ALL: { name: string; when: string; note: string; amt: string; st: Status; icon: string }[] = [
  { name: "Campus Cafe", when: "Today", note: "Repay by 7 Dec", amt: "₹125", st: "Upcoming", icon: ICONS.cafe },
  { name: "Xerox Corner", when: "Yesterday", note: "Repay by 6 Dec", amt: "₹35", st: "Upcoming", icon: ICONS.xerox },
  { name: "Stationery Hub", when: "Mon", note: "Repay by 5 Dec", amt: "₹240", st: "Upcoming", icon: ICONS.pen },
  { name: "Campus Cafe", when: "28 Oct", note: "Repaid 2 Nov", amt: "₹300", st: "Paid", icon: ICONS.cafe },
  { name: "Juice Point", when: "21 Oct", note: "Repaid 30 Oct", amt: "₹90", st: "Paid", icon: ICONS.cafe },
  { name: "Xerox Corner", when: "12 Oct", note: "Repaid 20 Oct", amt: "₹45", st: "Paid", icon: ICONS.xerox },
];
const STATUS: Record<Status, [string, string]> = {
  Upcoming: ["#FBF3C4", C.ink],
  Paid: [C.greenBg, C.greenInk],
  Overdue: [C.redBg, C.red],
};
const FILTERS = ["All", "Upcoming", "Paid", "Overdue"] as const;
type Filter = (typeof FILTERS)[number];

export default function Activity() {
  const [f, setF] = useState<Filter>("All");
  const rows = f === "All" ? ALL : ALL.filter((r) => r.st === f);
  const count = (x: Filter) => (x === "All" ? ALL.length : ALL.filter((r) => r.st === x).length);

  return (
    <Screen sheetTop={191}>
      <TopBar title="Activity" />
      <Rise delay={0.06} style={s.hero}>
        <Text style={s.heroLabel}>Spent this month</Text>
        <Text style={s.heroValue}>₹400</Text>
      </Rise>

      <Rise delay={0.1}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {FILTERS.map((label) => {
            const on = label === f;
            return (
              <Pressable
                key={label}
                onPress={() => setF(label)}
                accessibilityLabel={label}
                style={[s.chip, { backgroundColor: on ? C.ink : "#FFFFFF", borderColor: on ? C.ink : C.border }]}
              >
                <Text style={[s.chipText, { color: on ? "#FFFFFF" : C.ink }]}>{label}</Text>
                <View style={[s.chipCount, { backgroundColor: on ? "rgba(255,255,255,0.2)" : C.line }]}>
                  <Text style={[s.chipCountText, { color: on ? "#FFFFFF" : C.ink }]}>{count(label)}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Rise>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {rows.length > 0 ? (
          <Card>
            {rows.map((r, i) => (
              <Rise key={`${f}-${i}`} delay={i * 0.05}>
                <Pressable onPress={() => router.push("/(student)/receipt")} style={[s.row, i > 0 && k.line]}>
                  <View style={s.tile}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <Path d={r.icon} />
                    </Svg>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={k.rowTitle}>{r.name}</Text>
                    <Text style={k.rowSub}>
                      {r.when} · {r.note}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.amt}>{r.amt}</Text>
                    <View style={[s.status, { backgroundColor: STATUS[r.st][0] }]}>
                      <Text style={[s.statusText, { color: STATUS[r.st][1] }]}>{r.st}</Text>
                    </View>
                  </View>
                </Pressable>
              </Rise>
            ))}
          </Card>
        ) : (
          <Pop style={s.empty}>
            <View style={s.emptyIcon}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={C.greenInk} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12.5l4.5 4.5L19 7" />
              </Svg>
            </View>
            <Text style={s.emptyTitle}>Nothing overdue. Nice.</Text>
            <Text style={s.emptyBody}>Every payment is on time so far.</Text>
          </Pop>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { paddingTop: 22, paddingHorizontal: 24, paddingBottom: 24 },
  heroLabel: { fontSize: 14, fontWeight: "500", color: "rgba(11,11,12,0.62)" },
  heroValue: { marginTop: 6, fontSize: 48, fontWeight: "800", letterSpacing: -2.4, lineHeight: 50, marginLeft: -2 },
  chips: { paddingTop: 18, paddingHorizontal: 24, gap: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipText: { fontSize: 14, fontWeight: "800" },
  chipCount: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  chipCountText: { fontSize: 11, fontWeight: "800" },
  list: { paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 68 },
  tile: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.line, alignItems: "center", justifyContent: "center" },
  amt: { fontSize: 15, fontWeight: "800" },
  status: { marginTop: 4, height: 20, paddingHorizontal: 8, borderRadius: 10, justifyContent: "center" },
  statusText: { fontSize: 10, fontWeight: "800" },
  empty: { marginTop: 30, alignItems: "center" },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.greenBg, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 18, fontSize: 22, fontWeight: "800", letterSpacing: -0.66 },
  emptyBody: { marginTop: 8, fontSize: 14, lineHeight: 21, color: C.muted },
});
