import { View, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import { sendOtp } from "@/services/auth.service";
import Svg, { Path } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Join() {
  const [name, setName] = useState("Aarav Sharma");
  const [phone, setPhone] = useState("9876543210");

  const cleanDigits = phone.replace(/\D/g, "").slice(0, 10);
  const formattedPhone =
    cleanDigits.length > 5
      ? cleanDigits.slice(0, 5) + " " + cleanDigits.slice(5)
      : cleanDigits;
  const isValid = cleanDigits.length === 10 && name.trim().length > 1;

  const handleNext = async () => {
    if (!isValid) return;
    await sendOtp(cleanDigits, "signup");
    router.push({
      pathname: "/(auth)/otp-join",
      params: { name, phone: cleanDigits },
    });
  };

  return (
    <View style={s.root}>
      <View style={s.sheetBg} />
      <Glow style={s.radialGlow} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Step Progress Bar */}
          <View style={s.topBar}>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 6l-6 6 6 6" />
              </Svg>
            </Pressable>
            <View style={s.stepWrap}>
              <View style={s.stepRow}>
                <Text style={s.stepLabel}>Step 1 of 3</Text>
                <Text style={s.stepLabel}>Account</Text>
              </View>
              <View style={s.stepTrack}>
                <View style={s.stepFill} />
              </View>
            </View>
          </View>

          {/* Heading */}
          <View style={s.headSection}>
            <Text style={s.headTitle}>{"Create your\naccount"}</Text>
          </View>

          {/* Fields */}
          <View style={s.fieldSection}>
            <Text style={s.fieldLabel}>Full name</Text>
            <View style={s.nameCard}>
              <TextInput
                style={s.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="As on your college ID"
                placeholderTextColor="#9A9AA0"
              />
            </View>

            <Text style={[s.fieldLabel, s.mt18]}>Phone number</Text>
            <View style={s.phoneCard}>
              <View style={s.prefixBox}>
                <Text style={s.prefixText}>+91</Text>
              </View>
              <TextInput
                style={s.phoneInput}
                value={formattedPhone}
                onChangeText={setPhone}
                placeholder="98765 43210"
                placeholderTextColor="#9A9AA0"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            {/* Terms Disclaimer */}
            <View style={s.termsRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s.shieldIcon}>
                <Path d="M12 3l8 3v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" />
              </Svg>
              <Text style={s.termsText}>
                By continuing you agree to the Terms and the Privacy policy. Kredo is the app. A licensed lending partner assesses credit and moves the money.
              </Text>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={s.bottomCta}>
            {isValid ? (
              <Pressable onPress={handleNext} style={s.ctaBtnActive}>
                <Text style={s.ctaBtnActiveText}>Send code</Text>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12h14M13 6l6 6-6 6" />
                </Svg>
              </Pressable>
            ) : (
              <View style={s.ctaBtnDisabled}>
                <Text style={s.ctaBtnDisabledText}>Add your name and number</Text>
              </View>
            )}

            <Pressable onPress={() => router.push("/(auth)/login")} style={s.loginLink}>
              <Text style={s.loginText}>Already have an account? Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    gap: 16,
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
  stepWrap: {
    flex: 1,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B6B70",
  },
  stepTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EAE7DF",
    overflow: "hidden",
  },
  stepFill: {
    width: "33%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#E3CB4A",
  },
  headSection: {
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  headTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.6,
    lineHeight: 38,
    color: INK,
  },
  fieldSection: {
    paddingTop: 26,
    paddingHorizontal: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B6B70",
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  mt18: {
    marginTop: 18,
  },
  nameCard: {
    height: 60,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: BORDER,
    justifyContent: "center",
    paddingHorizontal: 18,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  nameInput: {
    fontSize: 17,
    fontWeight: "700",
    color: INK,
  },
  phoneCard: {
    height: 60,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    overflow: "hidden",
  },
  prefixBox: {
    height: "100%",
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  prefixText: {
    fontSize: 17,
    fontWeight: "800",
    color: INK,
  },
  phoneInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 17,
    fontWeight: "700",
    color: INK,
  },
  termsRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  shieldIcon: {
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B70",
    fontWeight: "500",
  },
  bottomCta: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 24,
  },
  ctaBtnActive: {
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  ctaBtnActiveText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  ctaBtnDisabled: {
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ECEAE4",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnDisabledText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#9A9AA0",
  },
  loginLink: {
    marginTop: 12,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B6B70",
  },
});
