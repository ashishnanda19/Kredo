import { useEffect, useRef, useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Rise } from "@/components/motion";
import { Screen, TopBar, SectionLabel, Card, Toast, Toggle, C, k } from "@/components/kit";
import { BottomSheet } from "@/components/bottom-sheet";

// Matches the Claude Design artboard "Privacy" (Privacy.dc.html).

const DEFS = [
  { id: "share", title: "Share with the lending partner", body: "Needed for credit checks. Cannot be turned off.", locked: true },
  { id: "remind", title: "Repayment reminders", body: "A nudge the day before each due date." },
  { id: "tips", title: "Tips and product updates", body: "Occasional news. Never promotions you did not ask for." },
] as const;

export default function Privacy() {
  const [on, setOn] = useState<Record<string, boolean>>({ share: true, remind: true, tips: false });
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (t.current && clearTimeout(t.current)), []);
  const flash = (msg: string) => {
    setToast(msg);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setToast(""), 2200);
  };

  return (
    <Screen sheetTop={92}>
      <TopBar title="Privacy and data" />
      <Toast text={toast} width={toast.length > 32 ? 300 : 260} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Rise delay={0.06}>
          <SectionLabel>What we use</SectionLabel>
          <Card>
            {DEFS.map((d, i) => (
              <View key={d.id} style={[s.toggleRow, i > 0 && k.line]}>
                <View style={{ flex: 1 }}>
                  <Text style={k.rowTitle}>{d.title}</Text>
                  <Text style={k.rowSub}>{d.body}</Text>
                </View>
                <Toggle
                  label={d.title}
                  on={on[d.id]}
                  locked={"locked" in d && d.locked}
                  onPress={() => !("locked" in d && d.locked) && setOn((o) => ({ ...o, [d.id]: !o[d.id] }))}
                />
              </View>
            ))}
          </Card>
        </Rise>

        <Rise delay={0.14} style={{ marginTop: 22 }}>
          <SectionLabel>Your data</SectionLabel>
          <Card>
            <Pressable onPress={() => flash("Your data file is being prepared")} style={s.dataRow}>
              <View style={k.iconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={k.rowTitle}>Download my data</Text>
                <Text style={k.rowSub}>A copy of what we keep, as a file.</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setConfirm(true)} style={[s.dataRow, k.line]}>
              <View style={[k.iconBox, { backgroundColor: C.redBg }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[k.rowTitle, { color: C.red }]}>Delete my data</Text>
                <Text style={k.rowSub}>Ask us to erase it, where the law allows.</Text>
              </View>
            </Pressable>
          </Card>
          <View style={k.note}>
            <Text style={k.noteText}>
              We never store ID photos or ID numbers. We keep only masked values, like the last 4 digits.
            </Text>
          </View>
        </Rise>
      </ScrollView>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)} label="Delete my data">
        <Text style={s.sheetTitle}>Delete your data?</Text>
        <Text style={s.sheetBody}>
          We will erase what we can. Records the law or your lending partner must keep, such as repayment history, stay
          for the required time. Pending repayments must be cleared first.
        </Text>
        <Pressable
          onPress={() => {
            setConfirm(false);
            flash("Request sent. We will confirm by email");
          }}
          style={s.deleteBtn}
        >
          <Text style={s.deleteText}>Send delete request</Text>
        </Pressable>
        <Pressable onPress={() => setConfirm(false)} style={s.keepBtn}>
          <Text style={s.keepText}>Keep my data</Text>
        </Pressable>
      </BottomSheet>
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
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 72 },
  dataRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64 },
  sheetTitle: { marginTop: 20, fontSize: 24, fontWeight: "800", letterSpacing: -0.96 },
  sheetBody: { marginTop: 10, fontSize: 14, lineHeight: 22, color: C.muted },
  deleteBtn: {
    marginTop: 20,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  keepBtn: { marginTop: 8, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  keepText: { fontSize: 15, fontWeight: "700" },
});
