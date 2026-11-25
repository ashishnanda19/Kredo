import { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { router, type Href } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Rise, Pop } from "@/components/motion";
import { Screen, TopBar, SectionLabel, Card, C, k } from "@/components/kit";

// Matches the Claude Design artboard "Notifications" (Notifications.dc.html).

const clock = "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z";
const check = "M5 12.5l4.5 4.5L19 7";
const spark = "M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z";
const doc = "M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6";

type Note = { title: string; body: string; time: string; icon: string; tile?: string; href: Href; unread?: boolean };

const TODAY: Note[] = [
  { title: "Repayment due in 5 days", body: "₹1,150 to the lending partner by 12 Nov.", time: "9:00 am", icon: clock, tile: "#FBF3C4", href: "/(student)/loan", unread: true },
  { title: "Paid ₹120 at Campus Cafe", body: "Receipt saved. Total to repay ₹125.", time: "1:42 pm", icon: check, tile: "#F1EFE9", href: "/(student)/receipt", unread: true },
  { title: "Aura went up by 4", body: "You repaid on time, 3 in a row.", time: "8:15 am", icon: spark, tile: "#F1DD6A", href: "/(student)/aura" },
];
const EARLIER: Note[] = [
  { title: "Statement ready", body: "Your October statement is ready to download.", time: "Yesterday", icon: doc, href: "/(student)/loan" },
  { title: "Limit raised to ₹3,000", body: "Two on-time repayments in a row.", time: "Mon", icon: spark, href: "/(student)/limit" },
  { title: "Welcome to Kredo", body: "Your ID was verified by the lending partner.", time: "12 Oct", icon: check, href: "/(student)/passport" },
];

function Row({ n, first, delay, read }: { n: Note; first: boolean; delay: number; read: boolean }) {
  return (
    <Rise delay={delay}>
      <Pressable onPress={() => router.push(n.href)} style={[s.row, !first && k.line]}>
        <View style={[s.tile, { backgroundColor: n.tile ?? C.line }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <Path d={n.icon} />
          </Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.title}>{n.title}</Text>
          <Text style={s.body}>{n.body}</Text>
        </View>
        <View style={s.meta}>
          <Text style={s.time}>{n.time}</Text>
          {n.unread && !read && <Pop style={s.dot} />}
        </View>
      </Pressable>
    </Rise>
  );
}

export default function Notifications() {
  const [read, setRead] = useState(false);
  return (
    <Screen sheetTop={92}>
      <TopBar
        title="Notifications"
        right={
          <Pressable onPress={() => setRead(true)} style={s.readAll}>
            <Text style={s.readAllText}>{read ? "All read" : "Mark all read"}</Text>
          </Pressable>
        }
      />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <SectionLabel>Today</SectionLabel>
        <Card>
          {TODAY.map((n, i) => (
            <Row key={n.title} n={n} first={i === 0} delay={i * 0.06} read={read} />
          ))}
        </Card>
        <SectionLabel style={{ paddingTop: 22 }}>Earlier</SectionLabel>
        <Card>
          {EARLIER.map((n, i) => (
            <Row key={n.title} n={n} first={i === 0} delay={0.2 + i * 0.06} read={read} />
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 94,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: "hidden",
  },
  content: { paddingTop: 4, paddingHorizontal: 24, paddingBottom: 28 },
  readAll: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
  },
  readAllText: { fontSize: 13, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 14 },
  tile: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  body: { fontSize: 12, fontWeight: "500", color: C.muted, marginTop: 3, lineHeight: 17 },
  meta: { alignItems: "flex-end", gap: 8 },
  time: { fontSize: 11, fontWeight: "600", color: C.mutedSoft },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#E3CB4A" },
});
