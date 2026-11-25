import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { BottomNav } from "@/components/bottom-nav";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Dues() {
  const items = [
    { title: "To the lending partner", sub: "6 payments, 12 Nov", amt: "₹1,150", to: "/(student)/loan" as const, lender: true },
    { title: "Campus Cafe", sub: "Repay by 7 Dec", amt: "₹125", to: "/(student)/receipt" as const, lender: false },
  ];

  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <Glow style={s.radialGlow} />

      {/* Top Header */}
      <View style={s.topBar}>
        <Text style={s.topTitle}>Dues</Text>
        <View style={s.reminderBadge}>
          <View style={s.dotYellow} />
          <Text style={s.reminderText}>Reminders on</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ring Hero */}
        <View style={s.heroSection}>
          <View style={s.ringWrap}>
            <Svg width={132} height={132} viewBox="0 0 132 132">
              <Circle cx="66" cy="66" r="60" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={10} />
              <Circle
                cx="66"
                cy="66"
                r="60"
                fill="none"
                stroke={INK}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray="377"
                strokeDashoffset="64"
                transform="rotate(-90 66 66)"
              />
            </Svg>
            <View style={s.ringCenter}>
              <Text style={s.daysNum}>5</Text>
              <Text style={s.daysLabel}>days left</Text>
            </View>
          </View>

          <View style={s.heroInfo}>
            <Text style={s.dueLabel}>Next due, 12 Nov</Text>
            <Text style={s.dueAmount}>₹1,150</Text>
            <Text style={s.dueSub}>Repay the lending partner. We nudge you the day before.</Text>
            <Pressable onPress={() => router.push("/(student)/repay")} style={s.repayBtn}>
              <Text style={s.repayBtnText}>Repay now</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {/* Coming Up List */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>Coming up</Text>
          <View style={s.itemsCard}>
            {items.map((it, idx) => (
              <View key={idx}>
                <Pressable onPress={() => router.push(it.to)} style={s.itemRow}>
                  <View style={[s.itemIcon, it.lender && { backgroundColor: "#F1DD6A" }]}>
                    {it.lender ? (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Rect x="4" y="5" width="16" height="15" rx="3" />
                        <Path d="M8 3v4M16 3v4M4 10h16" />
                      </Svg>
                    ) : (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2" />
                      </Svg>
                    )}
                  </View>
                  <View style={s.itemInfo}>
                    <Text style={s.itemTitle}>{it.title}</Text>
                    <Text style={s.itemSub}>{it.sub}</Text>
                  </View>
                  <Text style={s.itemAmt}>{it.amt}</Text>
                </Pressable>
                {idx < items.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Nudge Banner */}
        <View style={s.bannerCard}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 17l5-5 4 4 7-8" />
            <Path d="M15 8h5v5" />
          </Svg>
          <Text style={s.bannerText}>
            Repay on time and your limit steps up, with a reason each time.
          </Text>
        </View>
      </ScrollView>

      {/* Persistent Bottom Navigation */}
      <BottomNav active="dues" />
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
    top: 266,
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
    minHeight: 76,
  },
  topTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
    color: INK,
  },
  reminderBadge: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dotYellow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E3CB4A",
  },
  reminderText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  ringWrap: {
    width: 132,
    height: 132,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  daysNum: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.5,
    lineHeight: 40,
    color: INK,
  },
  daysLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(11,11,12,0.62)",
  },
  heroInfo: {
    flex: 1,
  },
  dueLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(11,11,12,0.62)",
  },
  dueAmount: {
    marginTop: 4,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.8,
    lineHeight: 40,
    color: INK,
  },
  dueSub: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(11,11,12,0.62)",
  },
  repayBtn: {
    marginTop: 10,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  repayBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sectionWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
    paddingBottom: 10,
  },
  itemsCard: {
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
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
    fontWeight: "700",
    color: INK,
  },
  itemSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  itemAmt: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
  bannerCard: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FBF3C4",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: INK,
  },
});
