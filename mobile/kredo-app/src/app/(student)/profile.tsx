import { useEffect, useRef, useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, TextInput, Platform } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { Text, resolveFont } from "@/components/ui/text";
import { Rise, Pulse, Pop } from "@/components/motion";
import { useAuthStore } from "@/store/auth";

// Matches the Claude Design artboard "Profile" (Profile.dc.html).

const INK = "#0B0B0C";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";
const LINE = "#F1EFE9";
const MUTED = "#6B6B70";
const SHEET_TOP = 283;

type Key = "name" | "phone" | "email" | "course" | "year";
const BASE: Record<Key, string> = {
  name: "Aarav Sharma",
  phone: "+91 98765 43210",
  email: "aarav@example.edu",
  course: "B.Tech, Computer Science",
  year: "2nd year",
};

function Field({
  label,
  value,
  editable,
  onChange,
  first,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange?: (v: string) => void;
  first?: boolean;
}) {
  return (
    <View style={[s.field, !first && s.fieldLine]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={editable}
        accessibilityLabel={label}
        style={[s.input, resolveFont({ fontWeight: "700" }), editable ? s.inputEditing : null]}
      />
    </View>
  );
}

export default function Profile() {
  const logout = useAuthStore((st) => st.logout);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Record<Key, string>>>({});
  const [values, setValues] = useState(BASE);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const v = { ...values, ...draft };
  const set = (k: Key) => (t: string) => setDraft((d) => ({ ...d, [k]: t }));
  const toggleEdit = () => {
    setEditing(!editing);
    setDraft({});
    setSaved(false);
  };
  const save = () => {
    setValues(v);
    setDraft({});
    setEditing(false);
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2200);
  };
  const logOut = () => {
    logout();
    router.replace("/(auth)/welcome");
  };
  const initial = (v.name || "A").trim().charAt(0).toUpperCase();

  return (
    <LinearGradient colors={["#F8DE45", "#F4D52F"]} style={s.root}>
      <View style={s.sheetBg} />

      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityLabel="Back to home">
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={s.topTitle}>Profile</Text>
        <Pressable onPress={toggleEdit} style={[s.editBtn, { backgroundColor: editing ? "#FFFFFF" : "#F1DD6A" }]}>
          <Text style={s.editText}>{editing ? "Cancel" : "Edit"}</Text>
        </Pressable>
      </View>

      {saved && (
        <Pop style={s.toast}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12.5l4.5 4.5L19 7" />
          </Svg>
          <Text style={s.toastText}>Saved</Text>
        </Pop>
      )}

      <Rise style={s.hero}>
        <View style={s.avatarWrap}>
          <Pulse style={s.avatarPulse} />
          <LinearGradient colors={["#F8E782", "#E9CD40"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </LinearGradient>
          <Pop delay={0.3} style={s.verifiedDot}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7" />
            </Svg>
          </Pop>
        </View>
        <Text style={s.name}>{v.name}</Text>
        <View style={s.chips}>
          <View style={s.chipDark}>
            <Text style={s.chipDarkText}>Verified student</Text>
          </View>
          <View style={s.chipLight}>
            <Text style={s.chipLightText}>Aura 82</Text>
          </View>
        </View>
      </Rise>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Rise delay={0.08}>
          <Text style={s.sectionLabel}>Personal details</Text>
          <View style={s.card}>
            <Field first label="Full name" value={v.name} editable={editing} onChange={set("name")} />
            <Field label="Phone" value={v.phone} editable={editing} onChange={set("phone")} />
            <Field label="Email" value={v.email} editable={editing} onChange={set("email")} />
          </View>
        </Rise>

        <Rise delay={0.16} style={{ marginTop: 22 }}>
          <Text style={s.sectionLabel}>College</Text>
          <View style={s.card}>
            <Field first label="College" value="Manipal University Jaipur" editable={false} />
            <Field label="Course" value={v.course} editable={editing} onChange={set("course")} />
            <Field label="Year" value={v.year} editable={editing} onChange={set("year")} />
            <Field label="Student ID" value="•••• 4521" editable={false} />
            <View style={[s.lockNote, s.fieldLine]}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Rect x="5" y="11" width="14" height="9" rx="2.5" />
                <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </Svg>
              <Text style={s.lockText}>
                College and student ID are checked by the lending partner. To change them, verify again.
              </Text>
            </View>
          </View>
        </Rise>

        <Rise delay={0.24} style={{ marginTop: 22 }}>
          <View style={s.card}>
            <View style={s.row}>
              <View style={[s.rowIcon, { backgroundColor: "#F1DD6A" }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="6" width="18" height="12" rx="3" />
                  <Path d="M3 10h18" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>Kredo card</Text>
                <Text style={s.rowSub}>•••• 0042 · limit ₹3,000</Text>
              </View>
            </View>
            <Pressable onPress={() => router.push("/(student)/privacy")} style={[s.row, s.fieldLine]}>
              <View style={s.rowIcon}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 3l8 3v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" />
                </Svg>
              </View>
              <Text style={[s.rowTitle, { flex: 1 }]}>Privacy and data</Text>
              <Chevron />
            </Pressable>
            <Pressable onPress={() => router.push("/(student)/help")} style={[s.row, s.fieldLine]}>
              <View style={s.rowIcon}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="9" />
                  <Path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
                </Svg>
              </View>
              <Text style={[s.rowTitle, { flex: 1 }]}>Help and support</Text>
              <Chevron />
            </Pressable>
            <Pressable onPress={logOut} style={[s.row, s.fieldLine]}>
              <View style={s.rowIcon}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10" />
                </Svg>
              </View>
              <Text style={[s.rowTitle, { flex: 1 }]}>Log out</Text>
            </Pressable>
          </View>
          <Text style={s.footnote}>Your college and ID only verify you. They never affect your Aura.</Text>
        </Rise>
      </ScrollView>

      {editing && (
        <LinearGradient colors={["rgba(250,249,246,0)", SHEET, SHEET]} locations={[0, 0.4, 1]} style={s.saveBar}>
          <Pressable onPress={save} style={s.saveBtn}>
            <Text style={s.saveText}>Save changes</Text>
          </Pressable>
        </LinearGradient>
      )}
    </LinearGradient>
  );
}

function Chevron() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

const cardShadow = Platform.select({
  android: { elevation: 2 },
  default: { shadowColor: INK, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 12 },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  sheetBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: SHEET_TOP,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: SHEET,
    shadowColor: "rgb(120,90,0)",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 84,
    zIndex: 5,
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
  topTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.34 },
  editBtn: {
    height: 44,
    minWidth: 64,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { fontSize: 14, fontWeight: "800" },
  toast: {
    position: "absolute",
    left: "50%",
    top: 92,
    marginLeft: -80,
    width: 160,
    height: 40,
    zIndex: 8,
    borderRadius: 20,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toastText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  hero: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 84,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  avatarWrap: { width: 96, height: 96 },
  avatarPulse: { left: 0, top: 0, width: 96, height: 96, borderRadius: 48, backgroundColor: "#F1DD6A" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 38, fontWeight: "800" },
  verifiedDot: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2E9B57",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { marginTop: 14, fontSize: 26, fontWeight: "800", letterSpacing: -1.04 },
  chips: { marginTop: 8, flexDirection: "row", gap: 8, alignItems: "center" },
  chipDark: { height: 26, paddingHorizontal: 12, borderRadius: 13, backgroundColor: INK, justifyContent: "center" },
  chipDarkText: { color: "#F5D832", fontSize: 12, fontWeight: "800" },
  chipLight: {
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },
  chipLightText: { fontSize: 12, fontWeight: "800" },
  scroll: { position: "absolute", left: 0, right: 0, top: SHEET_TOP, bottom: 0 },
  scrollContent: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 120 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.44,
    textTransform: "uppercase",
    color: MUTED,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 24,
    paddingVertical: 2,
    paddingHorizontal: 16,
    ...cardShadow,
  },
  field: { paddingVertical: 12 },
  fieldLine: { borderTopWidth: 1, borderTopColor: LINE },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: MUTED },
  input: {
    marginTop: 4,
    fontSize: 16,
    color: INK,
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
  },
  inputEditing: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderColor: "#E3CB4A",
    backgroundColor: "#FBF9EE",
  },
  lockNote: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  lockText: { flex: 1, fontSize: 13, lineHeight: 19, color: MUTED },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowSub: { fontSize: 12, fontWeight: "500", color: MUTED, marginTop: 2 },
  footnote: { marginTop: 14, fontSize: 12, lineHeight: 18, color: MUTED, textAlign: "center" },
  saveBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  saveBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
