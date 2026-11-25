import { View, Pressable, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/auth";
import { startStudentSession } from "@/services/auth.service";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";

export default function Unlocked() {
  const router = useRouter();
  const { verifyUser } = useAuthStore();
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    // Count up animation to 3,000
    const start = Date.now();
    const duration = 1200;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const val = 1 - Math.pow(1 - progress, 3);
      setAmount(Math.round(3000 * val));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    startStudentSession();
    verifyUser();
    router.replace("/(student)/home");
  };

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Glow style={styles.glow} />

      {/* ID Verified Pill */}
      <View style={styles.verifiedBadge}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 12.5l4.5 4.5L19 7" />
        </Svg>
        <Text style={styles.verifiedBadgeText}>ID verified</Text>
      </View>

      {/* Orbit Circle + Amount Bloom */}
      <View style={styles.orbitContainer}>
        {/* Outer Orbit Svg */}
        <Svg width={340} height={340} viewBox="0 0 340 340" style={styles.orbitSvg}>
          <Circle cx={170} cy={170} r={165} fill="none" stroke="#ECE9DF" strokeWidth={4} />
          <Circle cx={170} cy={170} r={165} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeDasharray="1037" strokeDashoffset="0" />
        </Svg>

        {/* Center Bloom Circle */}
        <LinearGradient colors={["#FFFFFF", "#FFF6CC", "#FBE98A"]} locations={[0, 0.55, 1]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.bloomCircle}>
          <Text style={styles.bloomMeta}>Limit unlocked</Text>
          <Text style={styles.bloomAmount}>₹{amount.toLocaleString("en-IN")}</Text>
        </LinearGradient>

        {/* Twinkle Stars */}
        <View style={[styles.twinkle, { left: 14, top: 56, width: 14, height: 14, backgroundColor: INK }]} />
        <View style={[styles.twinkle, { right: 8, top: 110, width: 10, height: 10, backgroundColor: "#E3CB4A" }]} />
        <View style={[styles.twinkle, { right: 52, bottom: 10, width: 12, height: 12, backgroundColor: INK }]} />
        <View style={[styles.twinkle, { left: 40, bottom: 36, width: 9, height: 9, backgroundColor: "#E3CB4A" }]} />
      </View>

      {/* Explanation text */}
      <View style={styles.explanationWrap}>
        <Text style={styles.explanationText}>
          <Text>Set by our lending partner.{"\n"}</Text>
          <Text>You always see the cost before you pay.</Text>
        </Text>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomWrap}>
        <Pressable onPress={handleStart} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Start using Kredo</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12h14M13 6l6 6-6 6" />
          </Svg>
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
    top: 40,
    width: 560,
    height: 560,
    marginLeft: -280,
    borderRadius: 280,
    backgroundColor: "rgba(241,221,106,0.55)",
  },
  verifiedBadge: {
    marginTop: 12,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifiedBadgeText: {
    color: "#1B6B3A",
    fontSize: 13,
    fontWeight: "800",
  },
  orbitContainer: {
    marginTop: 36,
    width: 340,
    height: 340,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  orbitSvg: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  bloomCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(150,115,0,0.7)",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
  },
  bloomMeta: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(11,11,12,0.65)",
  },
  bloomAmount: {
    marginTop: 10,
    fontSize: 68,
    lineHeight: 71,
    letterSpacing: -4.08,
    fontWeight: "800",
    color: INK,
  },
  twinkle: {
    position: "absolute",
    borderRadius: 3,
    transform: [{ rotate: "45deg" }],
  },
  explanationWrap: {
    marginTop: 32,
    alignItems: "center",
  },
  explanationText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#6B6B70",
  },
  bottomWrap: {
    marginTop: "auto",
    width: "100%",
    paddingBottom: 28,
  },
  primaryBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
