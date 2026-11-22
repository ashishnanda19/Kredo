import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path, Circle } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Notifications() {
  const notifs = [
    {
      id: "1",
      title: "Repayment due in 5 days",
      body: "₹1,150 due 12 Nov. Tap to pay now and keep your Aura high.",
      time: "2 hours ago",
      unread: true,
      route: "/(student)/repay",
    },
    {
      id: "2",
      title: "Limit increased to ₹3,000",
      body: "You unlocked Level 3! Thanks for repaying on time 2 times in a row.",
      time: "Yesterday",
      unread: false,
      route: "/(student)/limit",
    },
    {
      id: "3",
      title: "Paid ₹120 at Campus Cafe",
      body: "Lending partner paid the vendor. Repay by 7 Dec.",
      time: "2 days ago",
      unread: false,
      route: "/(student)/receipt",
    },
    {
      id: "4",
      title: "Quest completed: Email verified",
      body: "+2 Aura added to your score. You reached Main Character tier.",
      time: "4 days ago",
      unread: false,
      route: "/(student)/aura",
    },
  ];

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
        <Text style={s.topTitle}>Notifications</Text>
        <View style={s.spacer44} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.notifCard}>
          {notifs.map((n, idx) => (
            <View key={n.id}>
              <Pressable
                onPress={() => router.push(n.route as any)}
                style={s.notifRow}
              >
                <View style={s.iconBox}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
                    <Path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                  </Svg>
                  {n.unread && <View style={s.unreadDot} />}
                </View>
                <View style={s.notifInfo}>
                  <Text style={s.notifTitle}>{n.title}</Text>
                  <Text style={s.notifBody}>{n.body}</Text>
                  <Text style={s.notifTime}>{n.time}</Text>
                </View>
              </Pressable>
              {idx < notifs.length - 1 && <View style={s.divider} />}
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
    top: 92,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  notifCard: {
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
  notifRow: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E3CB4A",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  notifInfo: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  notifBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#6B6B70",
  },
  notifTime: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(11,11,12,0.45)",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
});
