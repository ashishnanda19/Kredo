import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import { Rise, Breathe, useCountUp } from "@/components/motion";
import { Ring } from "@/components/ring";
import { Screen, Card, C, k } from "@/components/kit";
import { BottomNav } from "@/components/bottom-nav";

// Matches the Claude Design artboard "Aura" (Aura.dc.html). Every change shows its plain reason.

const REASONS = [
  { delta: "+4", title: "Repaid ₹600 on time", sub: "3 on time in a row" },
  { delta: "+3", title: "Repaid ₹1,150 on time", sub: "First repayment" },
  { delta: "+5", title: "Verified student", sub: "College ID checked" },
];

export default function Aura() {
  const score = useCountUp(82, 1400);
  return (
    <Screen sheetTop={388}>
      <Rise style={s.top}>
        <Text style={s.h1}>Aura</Text>
        <View style={s.monthChip}>
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={C.greenInk} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 19V5M5 12l7-7 7 7" />
          </Svg>
          <Text style={s.monthText}>4 this month</Text>
        </View>
      </Rise>

      <Rise delay={0.06} style={s.hero}>
        <View style={s.ringBox}>
          <Breathe duration={3000} scale={1.04} style={s.ringGlowWrap}>
            <Glow style={s.ringGlow} color="rgba(241,221,106,0.5)" />
          </Breathe>
          <Ring size={220} r={90} width={14} pct={82} />
          <View style={s.ringCenter}>
            <Text style={s.score}>{score}</Text>
            <Text style={s.outOf}>out of 100</Text>
          </View>
        </View>
        <Text style={s.tier}>Main Character</Text>
      </Rise>

      <Rise delay={0.14} style={s.reasons}>
        <View style={s.reasonsHead}>
          <Text style={s.h2}>Why it changed</Text>
          <Pressable onPress={() => router.push("/(student)/quests")} style={s.questsBtn}>
            <Text style={s.questsText}>Quests</Text>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.cream} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 6l6 6-6 6" />
            </Svg>
          </Pressable>
        </View>
        <Card style={{ paddingVertical: 4 }}>
          {REASONS.map((r, i) => (
            <View key={r.title} style={[s.reason, i > 0 && k.line]}>
              <View style={s.delta}>
                <Text style={s.deltaText}>{r.delta}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.reasonTitle}>{r.title}</Text>
                <Text style={k.rowSub}>{r.sub}</Text>
              </View>
            </View>
          ))}
        </Card>
        <Text style={s.footnote}>Aura only looks at how you repay. Internal score, not a credit bureau score.</Text>
      </Rise>

      <BottomNav active="aura" />
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
  monthChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: C.greenBg,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  monthText: { fontSize: 12, fontWeight: "800", color: C.greenInk },
  hero: { marginTop: 22, paddingBottom: 26, alignItems: "center" },
  ringBox: { width: 220, height: 220 },
  ringGlowWrap: { position: "absolute", left: -30, top: -30, width: 280, height: 280 },
  ringGlow: { position: "absolute", left: 0, top: 0, width: 280, height: 280 },
  ringCenter: { position: "absolute", left: 0, top: 0, width: 220, height: 220, alignItems: "center", justifyContent: "center" },
  score: { fontSize: 76, fontWeight: "800", letterSpacing: -4.56, lineHeight: 78 },
  outOf: { marginTop: 6, fontSize: 13, fontWeight: "700", color: "rgba(11,11,12,0.62)" },
  tier: { marginTop: 22, fontSize: 22, fontWeight: "800", letterSpacing: -0.66 },
  reasons: { paddingTop: 22, paddingHorizontal: 24 },
  reasonsHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 },
  h2: { fontSize: 16, fontWeight: "800", letterSpacing: -0.32 },
  questsBtn: {
    height: 32,
    paddingLeft: 14,
    paddingRight: 12,
    borderRadius: 16,
    backgroundColor: C.ink,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  questsText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  reason: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 62 },
  delta: { width: 48, height: 30, borderRadius: 15, backgroundColor: C.cream, alignItems: "center", justifyContent: "center" },
  deltaText: { fontSize: 13, fontWeight: "800" },
  reasonTitle: { fontSize: 14, fontWeight: "700" },
  footnote: { marginTop: 12, fontSize: 12, lineHeight: 18, color: C.muted, textAlign: "center" },
});
