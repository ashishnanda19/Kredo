import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path, Rect } from "react-native-svg";
import { useAuthStore } from "@/store/auth";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Profile() {
  const { student, logout } = useAuthStore();
  const name = student?.name || "Aarav Sharma";

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/welcome");
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
        <Text style={s.topTitle}>Profile</Text>
        <Pressable onPress={handleLogout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Avatar & Pills */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitial}>{name[0]}</Text>
            </View>
            <View style={s.verifiedIcon}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12.5l4.5 4.5L19 7" />
              </Svg>
            </View>
          </View>
          <Text style={s.userName}>{name}</Text>
          <View style={s.pillsRow}>
            <View style={s.blackPill}>
              <Text style={s.blackPillText}>Verified student</Text>
            </View>
            <View style={s.whitePill}>
              <Text style={s.whitePillText}>Aura 82</Text>
            </View>
          </View>
        </View>

        {/* Personal Details Card */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>Personal details</Text>
          <View style={s.detailsCard}>
            <View style={s.fieldItem}>
              <Text style={s.fieldLabel}>Full name</Text>
              <Text style={s.fieldVal}>{name}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.fieldItem}>
              <Text style={s.fieldLabel}>Phone number</Text>
              <Text style={s.fieldVal}>+91 98765 43210</Text>
            </View>
            <View style={s.divider} />
            <View style={s.fieldItem}>
              <Text style={s.fieldLabel}>College email</Text>
              <Text style={s.fieldVal}>aarav.s@du.ac.in</Text>
            </View>
          </View>
        </View>

        {/* College Card */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>College</Text>
          <View style={s.detailsCard}>
            <View style={s.fieldItem}>
              <Text style={s.fieldLabel}>Institution</Text>
              <Text style={s.fieldVal}>Delhi University</Text>
            </View>
            <View style={s.divider} />
            <View style={s.fieldItem}>
              <Text style={s.fieldLabel}>Student ID</Text>
              <Text style={s.fieldVal}>2024-DU-8821</Text>
            </View>
            <View style={s.divider} />
            <View style={s.fieldItem}>
              <Text style={s.fieldLabel}>Year</Text>
              <Text style={s.fieldVal}>2nd Year</Text>
            </View>
          </View>
        </View>

        {/* Nav Links Card */}
        <View style={s.sectionWrap}>
          <View style={s.detailsCard}>
            <Pressable onPress={() => router.push("/(student)/passport")} style={s.navRow}>
              <View style={s.navIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x={3} y={5} width={18} height={14} rx={3} />
                  <Path d="M6 16c.8-1.6 4.2-1.6 5 0M14 10h4M14 13h3" />
                </Svg>
              </View>
              <Text style={s.navTitle}>Credit Passport</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </Pressable>

            <View style={s.divider} />

            <Pressable onPress={() => router.push("/(student)/privacy")} style={s.navRow}>
              <View style={s.navIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x={5} y={11} width={14} height={9} rx={2.5} />
                  <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </Svg>
              </View>
              <Text style={s.navTitle}>Privacy and data</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </Pressable>

            <View style={s.divider} />

            <Pressable onPress={() => router.push("/(student)/help")} style={s.navRow}>
              <View style={s.navIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Svg>
              </View>
              <Text style={s.navTitle}>Help & Support</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </Pressable>
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
    top: 260,
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
  logoutBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "700",
    color: INK,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 16,
  },
  avatarWrap: {
    position: "relative",
    width: 76,
    height: 76,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "800",
    color: YELLOW,
  },
  verifiedIcon: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#2E9B57",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    marginTop: 12,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: INK,
  },
  pillsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  blackPill: {
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: INK,
    justifyContent: "center",
  },
  blackPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: YELLOW,
  },
  whitePill: {
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },
  whitePillText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  sectionWrap: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#6B6B70",
    paddingBottom: 8,
  },
  detailsCard: {
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
  fieldItem: {
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B70",
  },
  fieldVal: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: INK,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
});
