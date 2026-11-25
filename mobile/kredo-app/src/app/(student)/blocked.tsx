import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Rise, Breathe } from "@/components/motion";
import { GrowBar } from "@/components/grow-bar";
import { Screen, TopBar, Card, C, k } from "@/components/kit";

// Matches the Claude Design artboard "Blocked" (Blocked.dc.html). Calm copy: no shame for a missed date.

const STEPS = [
  { n: "1", title: "Clear what is overdue", body: "₹1,150 to the lending partner. Biggest step up.", dark: true },
  { n: "2", title: "Do a quest", body: "Small actions that add a few Aura points." },
  { n: "3", title: "Start small again", body: "After clearing, a small first payment rebuilds trust." },
];

export default function Blocked() {
  return (
    <Screen sheetTop={92}>
      <TopBar title="Payments paused" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Rise delay={0.06} style={s.hero}>
          <Breathe duration={3000} style={s.pauseIcon}>
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Rect x="6" y="5" width="4" height="14" rx="1.6" />
              <Rect x="14" y="5" width="4" height="14" rx="1.6" />
            </Svg>
          </Breathe>
          <Text style={s.headline}>Paused for now.{"\n"}Easy to fix.</Text>
          <Text style={s.lede}>
            You have ₹1,150 past its due date. Clear it and payments switch back on. No rush, no penalty beyond the late
            fee shown.
          </Text>
        </Rise>

        <Rise delay={0.14} style={{ marginTop: 26 }}>
          <View style={s.progressHead}>
            <Text style={s.progressLabel}>Back to normal</Text>
            <Text style={s.progressValue}>Aura 62 of 70 needed</Text>
          </View>
          <GrowBar pct={72} height={8} track="#EAE7DF" fill="#E3CB4A" />
        </Rise>

        <Rise delay={0.2} style={{ marginTop: 22 }}>
          <Card>
            {STEPS.map((st, i) => (
              <View key={st.n} style={[s.step, i > 0 && k.line]}>
                <View style={[s.stepNum, st.dark && { backgroundColor: C.ink }]}>
                  <Text style={[s.stepNumText, st.dark && { color: C.cream }]}>{st.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={k.rowTitle}>{st.title}</Text>
                  <Text style={k.rowSub}>{st.body}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Rise>

        <Rise delay={0.26}>
          <Text style={s.footnote}>Most students are back in about a week.</Text>
        </Rise>
      </ScrollView>

      <Rise delay={0.3} style={s.footer}>
        <LinearGradient
          colors={["rgba(250,249,246,0)", C.sheet, C.sheet]}
          locations={[0, 0.36, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Pressable onPress={() => router.push("/(student)/repay")} style={k.bigButton}>
          <Text style={k.bigButtonText}>Repay ₹1,150</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(student)/quests")} style={s.secondary}>
          <Text style={s.secondaryText}>See quests</Text>
        </Pressable>
      </Rise>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 130 },
  hero: { alignItems: "center" },
  pauseIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: { marginTop: 22, fontSize: 30, fontWeight: "800", letterSpacing: -1.35, lineHeight: 32, textAlign: "center" },
  lede: { marginTop: 12, fontSize: 15, lineHeight: 23, color: C.muted, maxWidth: 300, textAlign: "center" },
  progressHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  progressLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1.44, textTransform: "uppercase", color: C.muted },
  progressValue: { fontSize: 12, fontWeight: "800" },
  step: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 76 },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.line,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontSize: 14, fontWeight: "800" },
  footnote: { marginTop: 14, fontSize: 12, lineHeight: 18, color: C.muted, textAlign: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 26, paddingHorizontal: 24, paddingBottom: 28, gap: 6 },
  secondary: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 15, fontWeight: "700" },
});
