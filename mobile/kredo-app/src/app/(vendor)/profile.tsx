import { View, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/store/auth";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function VendorProfile() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Form fields
  const [ownerName, setOwnerName] = useState("Ramesh Kumar");
  const [phone, setPhone] = useState("+91 91234 56780");
  const [email, setEmail] = useState("campuscafe@example.edu");
  const [stallName, setStallName] = useState("Campus Cafe");
  const [category, setCategory] = useState("Canteen");
  const [location, setLocation] = useState("Block B, campus");
  const [hours, setHours] = useState("8 am to 8 pm");

  const handleSave = () => {
    setEditing(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  };

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/welcome");
  };

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <View style={styles.glow} />
      <View style={styles.sheetBg} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.push("/(vendor)/today")} style={styles.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Stall profile</Text>
        <Pressable
          onPress={() => {
            if (editing) setEditing(false);
            else setEditing(true);
          }}
          style={[styles.editBtn, { backgroundColor: editing ? "#FFFFFF" : "#F1DD6A" }]}
        >
          <Text style={styles.editBtnText}>{editing ? "Cancel" : "Edit"}</Text>
        </Pressable>
      </View>

      {/* Toast Alert */}
      {savedToast && (
        <View style={styles.toastWrap}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12.5l4.5 4.5L19 7" />
          </Svg>
          <Text style={styles.toastText}>Saved</Text>
        </View>
      )}

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{stallName.charAt(0).toUpperCase() || "C"}</Text>
          </View>
          <View style={styles.checkBadge}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7" />
            </Svg>
          </View>
        </View>

        <Text style={styles.stallTitle}>{stallName}</Text>
        <View style={styles.badgesRow}>
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerBadgeText}>Kredo partner</Text>
          </View>
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>Open now</Text>
          </View>
        </View>
      </View>

      {/* Scrollable Form Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Owner Section */}
        <View style={styles.cardGroup}>
          <Text style={styles.groupHeader}>OWNER</Text>
          <View style={styles.infoCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Owner name</Text>
              <TextInput
                value={ownerName}
                onChangeText={setOwnerName}
                editable={editing}
                style={[styles.inputField, editing && styles.inputFieldEditing]}
              />
            </View>

            <View style={[styles.fieldRow, styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                editable={editing}
                style={[styles.inputField, editing && styles.inputFieldEditing]}
              />
            </View>

            <View style={[styles.fieldRow, styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                editable={editing}
                style={[styles.inputField, editing && styles.inputFieldEditing]}
              />
            </View>
          </View>
        </View>

        {/* Stall Section */}
        <View style={styles.cardGroup}>
          <Text style={styles.groupHeader}>STALL</Text>
          <View style={styles.infoCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Stall name</Text>
              <TextInput
                value={stallName}
                onChangeText={setStallName}
                editable={editing}
                style={[styles.inputField, editing && styles.inputFieldEditing]}
              />
            </View>

            <View style={[styles.fieldRow, styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>Category</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                editable={editing}
                style={[styles.inputField, editing && styles.inputFieldEditing]}
              />
            </View>

            <View style={[styles.fieldRow, styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                editable={editing}
                style={[styles.inputField, editing && styles.inputFieldEditing]}
              />
            </View>

            <View style={[styles.fieldRow, styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>Opening hours</Text>
              <TextInput
                value={hours}
                onChangeText={setHours}
                editable={editing}
                style={[styles.inputField, editing && styles.inputFieldEditing]}
              />
            </View>

            {/* Pinned map row */}
            <View style={[styles.actionRow, styles.fieldBorder]}>
              <View style={styles.pinIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
                  <Circle cx="12" cy="10" r="2.5" />
                </Svg>
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Pinned on the map</Text>
                <Text style={styles.actionSubtitle}>Students nearby see you in Near you</Text>
              </View>
              <View style={styles.gpsBadge}>
                <Text style={styles.gpsBadgeText}>GPS on</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Links Section */}
        <View style={styles.cardGroup}>
          <View style={styles.infoCard}>
            <View style={styles.actionRow}>
              <View style={styles.linkIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />
                </Svg>
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Payout account</Text>
                <Text style={styles.actionSubtitle}>Bank •••• 4821 · checked by the lending partner</Text>
              </View>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Rect x="5" y="11" width="14" height="9" rx="2.5" />
                <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </Svg>
            </View>

            <Pressable onPress={() => router.push("/(student)/privacy")} style={[styles.actionRow, styles.fieldBorder]}>
              <View style={styles.linkIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 3l8 3v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" />
                </Svg>
              </View>
              <Text style={[styles.actionTitle, { flex: 1 }]}>Privacy and data</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 6l6 6-6 6" />
              </Svg>
            </Pressable>

            <Pressable onPress={handleLogout} style={[styles.actionRow, styles.fieldBorder]}>
              <View style={styles.linkIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10" />
                </Svg>
              </View>
              <Text style={[styles.actionTitle, { flex: 1 }]}>Log out</Text>
            </Pressable>
          </View>

          <Text style={styles.disclaimerText}>
            Payouts come from the lending partner. Kredo never holds your money.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Save Button when editing */}
      {editing && (
        <View style={styles.saveWrap}>
          <Pressable onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save changes</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  glow: {
    position: "absolute",
    left: "50%",
    top: -60,
    width: 460,
    height: 300,
    marginLeft: -230,
    borderRadius: 230,
    backgroundColor: "rgba(255,246,205,0.75)",
  },
  sheetBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 283,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: SHEET_BG,
    shadowColor: "rgba(120,90,0,0.45)",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  headerBar: {
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
  },
  editBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  toastWrap: {
    position: "absolute",
    top: 88,
    alignSelf: "center",
    zIndex: 20,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 20,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  heroSection: {
    paddingTop: 8,
    alignItems: "center",
  },
  avatarWrap: {
    position: "relative",
    width: 96,
    height: 96,
  },
  avatarBox: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: INK,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  avatarText: {
    color: "#F1DD6A",
    fontSize: 38,
    fontWeight: "800",
  },
  checkBadge: {
    position: "absolute",
    right: -4,
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
  stallTitle: {
    marginTop: 14,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: INK,
  },
  badgesRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  partnerBadge: {
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: "#E3F2E8",
    alignItems: "center",
    justifyContent: "center",
  },
  partnerBadgeText: {
    color: "#1B6B3A",
    fontSize: 12,
    fontWeight: "800",
  },
  openBadge: {
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  scrollArea: {
    flex: 1,
    marginTop: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  cardGroup: {
    marginTop: 18,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#6B6B70",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  fieldRow: {
    paddingVertical: 10,
  },
  fieldBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F1EFE9",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B70",
  },
  inputField: {
    fontSize: 16,
    fontWeight: "700",
    color: INK,
    paddingVertical: 2,
  },
  inputFieldEditing: {
    borderWidth: 1,
    borderColor: "#E3CB4A",
    borderRadius: 12,
    backgroundColor: "#FBF9EE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
  },
  pinIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1DD6A",
    alignItems: "center",
    justifyContent: "center",
  },
  linkIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1EFE9",
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
  actionSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  gpsBadge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#E3F2E8",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsBadgeText: {
    color: "#1B6B3A",
    fontSize: 11,
    fontWeight: "800",
  },
  disclaimerText: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B70",
    textAlign: "center",
  },
  saveWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 16,
    backgroundColor: "rgba(250,249,246,0.95)",
  },
  saveBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
