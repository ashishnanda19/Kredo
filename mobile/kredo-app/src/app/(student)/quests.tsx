import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import Svg, { Path } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Quests() {
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});

  const defs = [
    {
      id: "email",
      icon: "M4 6h16v12H4zM4 7l8 6 8-6",
      tile: "#F1EFE9",
      title: "Verify your email",
      body: "Confirm the college email on your profile.",
      reward: 2,
      have: 1,
      need: 1,
    },
    {
      id: "three",
      icon: "M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2",
      tile: "#F1EFE9",
      title: "Pay at 3 different vendors",
      body: "Spread the love around campus.",
      reward: 1,
      have: 2,
      need: 3,
    },
    {
      id: "early",
      icon: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
      tile: "#FBF3C4",
      title: "Repay 2 days early",
      body: "Repay before the due date once.",
      reward: 3,
      have: 0,
      need: 1,
    },
  ];

  const earnedPts = defs.reduce(
    (acc, q) => acc + (claimed[q.id] ? q.reward : 0),
    0
  );

  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <Glow style={s.radialGlow} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={s.topTitle}>Quests</Text>
        <View style={s.spacer44} />
      </View>

      {/* Hero */}
      <View style={s.heroSection}>
        <Text style={s.heroLabel}>Aura from quests</Text>
        <Text style={s.heroPts}>+{earnedPts}</Text>
        <Text style={s.heroSub}>
          Small actions, small boosts. Repaying on time still counts the most.
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.questList}>
          {defs.map((q) => {
            const isDone = q.have >= q.need;
            const isClaimed = !!claimed[q.id];
            const pct = Math.min(100, Math.round((q.have / q.need) * 100));

            return (
              <View
                key={q.id}
                style={[
                  s.questCard,
                  isDone && !isClaimed ? s.cardHighlight : s.cardNormal,
                ]}
              >
                <View style={s.questTop}>
                  <View style={[s.questIconBox, { backgroundColor: q.tile }]}>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <Path d={q.icon} />
                    </Svg>
                  </View>
                  <View style={s.questInfo}>
                    <Text style={s.questTitle}>{q.title}</Text>
                    <Text style={s.questBody}>{q.body}</Text>
                  </View>
                  <View style={s.rewardPill}>
                    <Text style={s.rewardText}>+{q.reward}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={s.progressRow}>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={s.progressLabel}>
                    {q.have} of {q.need}
                  </Text>
                </View>

                {/* Claim button / Claimed badge */}
                {isDone && !isClaimed && (
                  <Pressable
                    onPress={() => setClaimed({ ...claimed, [q.id]: true })}
                    style={s.claimBtn}
                  >
                    <Text style={s.claimBtnText}>Claim +{q.reward} Aura</Text>
                  </Pressable>
                )}

                {isClaimed && (
                  <View style={s.claimedBadge}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M5 12.5l4.5 4.5L19 7" />
                    </Svg>
                    <Text style={s.claimedText}>Claimed</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={s.footerNote}>
          Quests never use your college, gender, caste, religion or location.
        </Text>
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
    top: 251,
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
    paddingBottom: 20,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(11,11,12,0.62)",
  },
  heroPts: {
    marginTop: 4,
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -2.5,
    lineHeight: 58,
    color: INK,
  },
  heroSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(11,11,12,0.62)",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  questList: {
    gap: 12,
  },
  questCard: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  cardNormal: {
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHighlight: {
    borderWidth: 1,
    borderColor: "#E3CB4A",
  },
  questTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  questIconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  questBody: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
    lineHeight: 16,
  },
  rewardPill: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: "#FBF3C4",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  progressRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EAE7DF",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#E3CB4A",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B6B70",
  },
  claimBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 24,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  claimBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  claimedBadge: {
    marginTop: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  claimedText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1B6B3A",
  },
  footerNote: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B70",
    textAlign: "center",
  },
});
