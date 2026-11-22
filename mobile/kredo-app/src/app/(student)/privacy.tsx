import { View, Pressable, StyleSheet, ScrollView, Switch } from "react-native";
import { useState, useRef } from "react";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path, Rect } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Privacy() {
  const [notifs, setNotifs] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

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
        <Text style={s.topTitle}>Privacy and data</Text>
        <View style={s.spacer44} />
      </View>

      {/* Toast Alert */}
      {toast && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* What We Use */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>What we use</Text>
          <View style={s.card}>
            <View style={s.toggleRow}>
              <View style={s.toggleInfo}>
                <Text style={s.toggleTitle}>Phone number & College ID</Text>
                <Text style={s.toggleSub}>Required for lending partner verification and account access.</Text>
              </View>
              <Switch value={true} disabled trackColor={{ true: "#2E9B57", false: "#CFCBC0" }} />
            </View>

            <View style={s.divider} />

            <View style={s.toggleRow}>
              <View style={s.toggleInfo}>
                <Text style={s.toggleTitle}>Payment notifications</Text>
                <Text style={s.toggleSub}>Reminders 1 day before repayment is due.</Text>
              </View>
              <Switch
                value={notifs}
                onValueChange={setNotifs}
                trackColor={{ true: "#2E9B57", false: "#CFCBC0" }}
              />
            </View>

            <View style={s.divider} />

            <View style={s.toggleRow}>
              <View style={s.toggleInfo}>
                <Text style={s.toggleTitle}>Product analytics</Text>
                <Text style={s.toggleSub}>Help us improve app features with anonymous metrics.</Text>
              </View>
              <Switch
                value={analytics}
                onValueChange={setAnalytics}
                trackColor={{ true: "#2E9B57", false: "#CFCBC0" }}
              />
            </View>
          </View>
        </View>

        {/* Your Data Actions */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>Your data</Text>
          <View style={s.card}>
            <Pressable onPress={() => showToast("Data export requested")} style={s.actionRow}>
              <View style={s.iconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
                </Svg>
              </View>
              <View style={s.actionInfo}>
                <Text style={s.actionTitle}>Download my data</Text>
                <Text style={s.actionSub}>A copy of what we keep, as a file.</Text>
              </View>
            </Pressable>

            <View style={s.divider} />

            <Pressable onPress={() => showToast("Deletion request logged")} style={s.actionRow}>
              <View style={s.iconBoxRed}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#A3261B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
                </Svg>
              </View>
              <View style={s.actionInfo}>
                <Text style={s.actionTitleRed}>Delete my data</Text>
                <Text style={s.actionSub}>Ask us to erase it, where the law allows.</Text>
              </View>
            </Pressable>
          </View>

          <View style={s.infoBanner}>
            <Text style={s.infoBannerText}>
              We never store ID photos or ID numbers. We keep only masked values, like the last 4 digits.
            </Text>
          </View>
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
  toast: {
    position: "absolute",
    top: 92,
    alignSelf: "center",
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#6B6B70",
    paddingBottom: 8,
  },
  card: {
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
    paddingVertical: 10,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  toggleSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxRed: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F9E1DE",
    alignItems: "center",
    justifyContent: "center",
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  actionTitleRed: {
    fontSize: 15,
    fontWeight: "700",
    color: "#A3261B",
  },
  actionSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
  infoBanner: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#FBF3C4",
  },
  infoBannerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: INK,
  },
});
