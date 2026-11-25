import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useState, useEffect, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import Svg, { Path } from "react-native-svg";
import { verifyOtp } from "@/services/auth.service";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function OtpJoin() {
  const params = useLocalSearchParams();
  const phone = (params["phone"] as string) || "98765 43210";
  const name = (params["name"] as string) || "Aarav Sharma";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [timer, setTimer] = useState(30);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFinish = async (c: string) => {
    if (c.length < 6 || busy) return;
    setBusy(true);
    try {
      await verifyOtp(phone.replace(/\D/g, ""), c);
      setTimeout(() => {
        router.push({
          pathname: "/(auth)/verify",
          params: { name, phone },
        });
      }, 700);
    } catch (e: any) {
      alert(e.message || "Invalid OTP");
      setBusy(false);
      setCode("");
    }
  };

  const handleKeyPress = (val: string) => {
    if (busy || code.length >= 6) return;
    const next = code + val;
    setCode(next);
    if (next.length === 6) {
      handleFinish(next);
    }
  };

  const handleDelete = () => {
    if (busy || code.length === 0) return;
    setCode(code.slice(0, -1));
  };

  const handleAutofill = () => {
    if (busy) return;
    let i = 0;
    setCode("");
    const target = "123456";
    const interval = setInterval(() => {
      i += 1;
      const sub = target.slice(0, i);
      setCode(sub);
      if (i >= 6) {
        clearInterval(interval);
        handleFinish(sub);
      }
    }, 180);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "gap", "0", "del"];

  return (
    <View style={s.root}>
      <View style={s.sheetBg} />
      <Glow style={s.radialGlow} />

      {/* Top Step Progress Bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
      </View>

      {/* Heading */}
      <View style={s.headSection}>
        <Text style={s.headTitle}>{"Enter the\ncode"}</Text>
        <Text style={s.headSub}>Sent to +91 {phone}.</Text>
      </View>

      {/* 6 OTP Cells */}
      <View style={s.otpSection}>
        <View style={s.boxesRow}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const ch = code[i] || "";
            const isActive = i === code.length && !busy;
            return (
              <View
                key={i}
                style={[
                  s.box,
                  ch ? s.boxFilled : isActive ? s.boxActive : s.boxEmpty,
                ]}
              >
                <Text style={s.boxText}>{ch}</Text>
                {isActive && <View style={s.caret} />}
              </View>
            );
          })}
        </View>

        {/* Timer & Demo Code Row */}
        <View style={s.timerRow}>
          {busy ? (
            <View style={s.busyWrap}>
              <ActivityIndicator size="small" color="#E3CB4A" />
              <Text style={s.busyText}>Checking…</Text>
            </View>
          ) : (
            <Text style={s.timerText}>
              Resend code in{" "}
              <Text style={s.timerBold}>00:{String(timer).padStart(2, "0")}</Text>
            </Text>
          )}

          <Pressable onPress={handleAutofill} style={s.demoBtn}>
            <Text style={s.demoBtnText}>Demo code 123456</Text>
          </Pressable>
        </View>
      </View>

      {/* Built-in Keypad */}
      <View style={s.keypadSection}>
        <View style={s.keypadGrid}>
          {keys.map((k, idx) => {
            if (k === "gap") {
              return <View key={idx} style={s.keyCell} />;
            }
            if (k === "del") {
              return (
                <Pressable
                  key={idx}
                  onPress={handleDelete}
                  style={s.keyCell}
                >
                  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-6-6z" />
                    <Path d="M12 10l4 4M16 10l-4 4" />
                  </Svg>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={idx}
                onPress={() => handleKeyPress(k)}
                style={s.keyCell}
              >
                <Text style={s.keyText}>{k}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
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
    width: "66%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#E3CB4A",
  },
  headSection: {
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  headTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.6,
    lineHeight: 38,
    color: INK,
  },
  headSub: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#6B6B70",
    fontWeight: "500",
  },
  otpSection: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  boxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  box: {
    width: 48,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  boxEmpty: {
    borderColor: BORDER,
  },
  boxActive: {
    borderColor: "#E3CB4A",
  },
  boxFilled: {
    borderColor: INK,
    transform: [{ translateY: -2 }],
  },
  boxText: {
    fontSize: 26,
    fontWeight: "800",
    color: INK,
  },
  caret: {
    position: "absolute",
    width: 2,
    height: 26,
    backgroundColor: INK,
  },
  timerRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },
  busyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  busyText: {
    fontSize: 14,
    fontWeight: "700",
    color: INK,
  },
  timerText: {
    fontSize: 14,
    color: "#6B6B70",
  },
  timerBold: {
    color: INK,
    fontWeight: "700",
  },
  demoBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FBF3C4",
    alignItems: "center",
    justifyContent: "center",
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  keypadSection: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  keyCell: {
    width: "33.333%",
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 26,
    fontWeight: "600",
    color: INK,
  },
});
