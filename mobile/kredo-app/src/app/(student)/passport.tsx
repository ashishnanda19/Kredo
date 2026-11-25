import { View, Pressable, StyleSheet, Share } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Rise, Pop, useCountUp } from "@/components/motion";
import { Screen, Card, C, k, cardShadow } from "@/components/kit";
import { BottomNav } from "@/components/bottom-nav";

// Matches the Claude Design artboard "Passport" (Passport.dc.html).

const MILESTONES = [
  { title: "Verified", when: "Aug 2026", icon: <Path d="M5 12.5l4.5 4.5L19 7" />, sw: 2.4 },
  {
    title: "First repayment",
    when: "Sep 2026",
    icon: (
      <>
        <Rect x="4" y="5" width="16" height="15" rx="3" />
        <Path d="M8 3v4M16 3v4M4 10h16" />
      </>
    ),
    sw: 2,
  },
  { title: "3 on time in a row", when: "Oct 2026", icon: <Path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />, sw: 2 },
];

export default function Passport() {
  const count = useCountUp(6, 1100);
  const repaid = useCountUp(4350, 1100);
  const share = () =>
    Share.share({ message: "My Kredo Credit Passport: 6 on-time repayments since Aug 2026. Internal score, not a credit bureau score." });

  return (
    <Screen sheetTop={227}>
      <Rise style={s.top}>
        <Text style={s.h1}>Passport</Text>
        <Pressable onPress={share} style={k.round} accessibilityLabel="Share passport">
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
          </Svg>
        </Pressable>
      </Rise>

      <Rise delay={0.06} style={s.hero}>
        <Text style={s.since}>Credit Passport · since Aug 2026</Text>
        <View style={s.countRow}>
          <Text style={s.count}>{count}</Text>
          <Text style={s.countLabel}>on-time{"\n"}repayments</Text>
        </View>
      </Rise>

      <Rise delay={0.14} style={s.stats}>
        <View style={s.stat}>
          <Text style={s.statLabel}>Repaid in total</Text>
          <Text style={s.statValue}>₹{repaid.toLocaleString("en-IN")}</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statLabel}>Current limit</Text>
          <Text style={s.statValue}>₹3,000</Text>
        </View>
      </Rise>

      <Rise delay={0.2} style={s.section}>
        <Text style={s.h2}>Milestones</Text>
        <Card style={{ paddingVertical: 4 }}>
          {MILESTONES.map((m, i) => (
            <View key={m.title} style={[s.row, i > 0 && k.line]}>
              <Pop delay={0.3 + i * 0.1} style={s.badge}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={m.sw} strokeLinecap="round" strokeLinejoin="round">
                  {m.icon}
                </Svg>
              </Pop>
              <Text style={s.rowTitle}>{m.title}</Text>
              <Text style={s.when}>{m.when}</Text>
            </View>
          ))}
        </Card>
        <Text style={s.footnote}>Internal score, not a credit bureau score.</Text>
      </Rise>

      <BottomNav active="passport" />
    </Screen>
  );
}

const s = StyleSheet.create({
  top: {
    paddingTop: 32,
    paddingHorizontal: 24,
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h1: { fontSize: 26, fontWeight: "800", letterSpacing: -1.04 },
  hero: { paddingTop: 26, paddingHorizontal: 24, paddingBottom: 28 },
  since: { fontSize: 14, fontWeight: "600", color: "rgba(11,11,12,0.62)" },
  countRow: { marginTop: 6, flexDirection: "row", alignItems: "flex-end", gap: 12 },
  count: { fontSize: 76, fontWeight: "800", letterSpacing: -4.56, lineHeight: 78, marginLeft: -3 },
  countLabel: { paddingBottom: 10, fontSize: 17, fontWeight: "800", lineHeight: 20 },
  stats: { marginTop: 22, marginHorizontal: 24, flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
    ...cardShadow,
  },
  statLabel: { fontSize: 12, fontWeight: "600", color: C.muted },
  statValue: { marginTop: 6, fontSize: 22, fontWeight: "800", letterSpacing: -0.66 },
  section: { paddingTop: 22, paddingHorizontal: 24 },
  h2: { fontSize: 16, fontWeight: "800", letterSpacing: -0.32, paddingBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.cream, alignItems: "center", justifyContent: "center" },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: "700" },
  when: { fontSize: 12, fontWeight: "500", color: C.muted },
  footnote: { marginTop: 12, fontSize: 12, lineHeight: 18, color: C.muted, textAlign: "center" },
});
