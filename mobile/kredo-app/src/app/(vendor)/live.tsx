import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/store/auth";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";

export default function VendorLive() {
  const router = useRouter();
  const { verifyUser } = useAuthStore();

  const handleShowQr = () => {
    verifyUser();
    router.push("/(vendor)/qr");
  };

  const handleGoToday = () => {
    verifyUser();
    router.replace("/(vendor)/today");
  };

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View style={styles.glow} />

      {/* Approved Pill */}
      <View style={styles.approvedBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.approvedBadgeText}>Stall approved</Text>
      </View>

      {/* Orbit Circle + QR Bloom */}
      <View style={styles.orbitContainer}>
        {/* Outer Orbit Svg */}
        <Svg width={340} height={340} viewBox="0 0 340 340" style={styles.orbitSvg}>
          <Circle cx={170} cy={170} r={165} fill="none" stroke="#ECE9DF" strokeWidth={4} />
          <Circle cx={170} cy={170} r={165} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeDasharray="1037" strokeDashoffset="0" />
        </Svg>

        {/* Center Bloom Circle */}
        <View style={styles.bloomCircle}>
          <View style={styles.qrBadge}>
            <Svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
              <Rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
              <Rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
              <Path d="M14 14h3v3h-3zM19 14h1.5M14 19h2M18.5 18.5h2v2h-2z" />
            </Svg>
          </View>
          <Text style={styles.bloomTitle}>You are live</Text>
          <View style={styles.subStallRow}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7" />
            </Svg>
            <Text style={styles.subStallText}>Campus Cafe, Block B</Text>
          </View>
        </View>

        {/* Twinkle Stars */}
        <View style={[styles.twinkle, { left: 14, top: 56, width: 14, height: 14, backgroundColor: INK }]} />
        <View style={[styles.twinkle, { right: 8, top: 110, width: 10, height: 10, backgroundColor: "#E3CB4A" }]} />
        <View style={[styles.twinkle, { right: 52, bottom: 10, width: 12, height: 12, backgroundColor: INK }]} />
        <View style={[styles.twinkle, { left: 40, bottom: 36, width: 9, height: 9, backgroundColor: "#E3CB4A" }]} />
      </View>

      {/* Explanation text */}
      <View style={styles.explanationWrap}>
        <Text style={styles.explanationText}>
          <Text>Students nearby can now find you.{"\n"}</Text>
          <Text>Show your QR to get your first payment.</Text>
        </Text>
      </View>

      {/* Bottom CTAs */}
      <View style={styles.bottomWrap}>
        <Pressable onPress={handleShowQr} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Show my stall QR</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12h14M13 6l6 6-6 6" />
          </Svg>
        </Pressable>

        <Pressable onPress={handleGoToday} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Go to Today</Text>
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
  approvedBadge: {
    marginTop: 12,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2E9B57",
  },
  approvedBadgeText: {
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
  qrBadge: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  bloomTitle: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1,
    color: INK,
  },
  subStallRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subStallText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(11,11,12,0.7)",
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
    gap: 8,
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
  secondaryBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
});
