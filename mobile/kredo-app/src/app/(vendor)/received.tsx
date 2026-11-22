import { View, Pressable, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";

export default function VendorReceived() {
  const router = useRouter();
  const [amt, setAmt] = useState(0);

  useEffect(() => {
    // Count up animation to 125
    const start = Date.now();
    const duration = 900;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const val = 1 - Math.pow(1 - progress, 3);
      setAmt(Math.round(125 * val));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background radial glow */}
      <View style={styles.glow} />

      {/* Confetti particles */}
      <View style={[styles.confetti, { top: 180, left: 60, backgroundColor: INK, transform: [{ rotate: "25deg" }] }]} />
      <View style={[styles.confetti, { top: 160, right: 70, backgroundColor: "#FFFFFF", transform: [{ rotate: "-40deg" }] }]} />
      <View style={[styles.confetti, { top: 270, right: 40, backgroundColor: INK, transform: [{ rotate: "15deg" }] }]} />
      <View style={[styles.confetti, { top: 280, left: 30, backgroundColor: "#FFFFFF", transform: [{ rotate: "-20deg" }] }]} />

      {/* Center Content */}
      <View style={styles.centerSection}>
        {/* Equalizer Pill */}
        <View style={styles.eqPill}>
          <View style={styles.eqBars}>
            <View style={[styles.eqBar, { height: 16 }]} />
            <View style={[styles.eqBar, { height: 10 }]} />
            <View style={[styles.eqBar, { height: 14 }]} />
            <View style={[styles.eqBar, { height: 8 }]} />
            <View style={[styles.eqBar, { height: 12 }]} />
          </View>
          <Text style={styles.eqPillText}>Payment received</Text>
        </View>

        {/* Ripple Icon Circle */}
        <View style={styles.rippleWrap}>
          <View style={styles.rippleOuter} />
          <View style={styles.rippleCenter}>
            <Svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke={YELLOW} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7" />
            </Svg>
          </View>
        </View>

        {/* Amount & Sender */}
        <Text style={styles.amountDisplay}>₹{amt}</Text>
        <Text style={styles.senderText}>from Aarav · 1:42 pm</Text>
      </View>

      {/* Payout Info Card */}
      <View style={styles.infoCard}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 8v4l3 2" />
        </Svg>
        <Text style={styles.infoText}>
          <Text style={{ fontWeight: "800", color: INK }}>Paid out at 1:42 am. </Text>
          <Text>The lending partner pays you. Kredo never holds the money.</Text>
        </Text>
      </View>

      {/* Bottom Done CTA */}
      <View style={styles.bottomWrap}>
        <Pressable
          onPress={() => router.push("/(vendor)/today")}
          style={styles.doneBtn}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YELLOW,
    paddingTop: 36,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    left: "50%",
    top: 100,
    width: 520,
    height: 520,
    marginLeft: -260,
    borderRadius: 260,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 16,
    borderRadius: 3,
  },
  centerSection: {
    marginTop: 70,
    alignItems: "center",
  },
  eqPill: {
    height: 36,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: 18,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eqBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 16,
  },
  eqBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: YELLOW,
  },
  eqPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  rippleWrap: {
    marginTop: 56,
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  rippleOuter: {
    position: "absolute",
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 2,
    borderColor: "rgba(11,11,12,0.25)",
  },
  rippleCenter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  amountDisplay: {
    marginTop: 36,
    fontSize: 84,
    fontWeight: "800",
    letterSpacing: -3,
    color: INK,
  },
  senderText: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(11,11,12,0.72)",
  },
  infoCard: {
    marginTop: 34,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.6)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(11,11,12,0.78)",
  },
  bottomWrap: {
    marginTop: "auto",
    width: "100%",
    paddingBottom: 28,
  },
  doneBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
