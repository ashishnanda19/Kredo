import { View, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import Svg, { Path, Rect } from "react-native-svg";
import { sendOtp } from "@/services/auth.service";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Login() {
  const [phone, setPhone] = useState("9876543210");
  const [loading, setLoading] = useState(false);

  const cleanDigits = phone.replace(/\D/g, "").slice(0, 10);
  const formattedPhone =
    cleanDigits.length > 5
      ? cleanDigits.slice(0, 5) + " " + cleanDigits.slice(5)
      : cleanDigits;
  const isValid = cleanDigits.length === 10;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await sendOtp(cleanDigits, "login");
      router.push({
        pathname: "/(auth)/otp",
        params: { phone: cleanDigits },
      });
    } catch (e: any) {
      alert(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <Glow style={s.radialGlow} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        {/* Top Back Button */}
        <View style={s.topBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 6l-6 6 6 6" />
            </Svg>
          </Pressable>
        </View>

        {/* Heading */}
        <View style={s.headSection}>
          <Text style={s.headTitle}>{"Welcome\nback"}</Text>
          <Text style={s.headSub}>Enter your phone number. We send a 6-digit code.</Text>
        </View>

        {/* Input Field Card */}
        <View style={s.inputSection}>
          <View style={s.inputCard}>
            <View style={s.prefixBox}>
              <Text style={s.prefixText}>+91</Text>
            </View>
            <TextInput
              style={s.textInput}
              value={formattedPhone}
              onChangeText={(val) => setPhone(val)}
              placeholder="98765 43210"
              placeholderTextColor="#9A9AA0"
              keyboardType="phone-pad"
              maxLength={11}
            />
            {isValid && (
              <View style={s.validBadge}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12.5l4.5 4.5L19 7" />
                </Svg>
              </View>
            )}
          </View>

          {/* Privacy Disclaimer */}
          <View style={s.disclaimer}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Rect x={5} y={11} width={14} height={9} rx={2.5} />
              <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </Svg>
            <Text style={s.disclaimerText}>We only use your number to sign you in.</Text>
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={s.bottomCta}>
          {isValid ? (
            <Pressable onPress={handleSubmit} disabled={loading} style={s.ctaBtnActive}>
              <Text style={s.ctaBtnActiveText}>{loading ? "Sending…" : "Send code"}</Text>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
            </Pressable>
          ) : (
            <View style={s.ctaBtnDisabled}>
              <Text style={s.ctaBtnDisabledText}>Enter your 10-digit number</Text>
            </View>
          )}

          <Pressable onPress={() => router.push("/(auth)/join")} style={s.joinLink}>
            <Text style={s.joinText}>New to Kredo? Create an account</Text>
          </Pressable>
        </View>
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
  headSection: {
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  headTitle: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.8,
    lineHeight: 42,
    color: INK,
  },
  headSub: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#6B6B70",
    fontWeight: "500",
  },
  inputSection: {
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  inputCard: {
    height: 64,
    borderRadius: 22,
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
  textInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: "700",
    color: INK,
  },
  validBadge: {
    marginRight: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E3F2E8",
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: "#6B6B70",
    fontWeight: "500",
  },
  bottomCta: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 28,
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
  joinLink: {
    marginTop: 12,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  joinText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B6B70",
  },
});
