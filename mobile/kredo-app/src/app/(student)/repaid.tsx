import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";

export default function Repaid() {
  return (
    <View style={s.root}>
      {/* Background radial glow */}
      <View style={s.radialGlow} />

      {/* Confetti */}
      <View style={[s.confetti, { top: 90, left: 70, transform: [{ rotate: "25deg" }] }]} />
      <View style={[s.confettiWhite, { top: 80, right: 80, transform: [{ rotate: "-40deg" }] }]} />
      <View style={[s.confetti, { top: 160, right: 40, transform: [{ rotate: "15deg" }] }]} />
      <View style={[s.confettiWhite, { top: 170, left: 40, transform: [{ rotate: "-20deg" }] }]} />

      {/* Center Section */}
      <View style={s.centerSection}>
        <View style={s.badgeWrap}>
          <View style={s.rippleRing} />
          <View style={s.checkCircle}>
            <Svg width={50} height={50} viewBox="0 0 24 24" fill="none" stroke={YELLOW} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7" />
            </Svg>
          </View>
        </View>

        <Text style={s.title}>{"Repaid.\nOn time."}</Text>
        <Text style={s.sub}>{"₹1,150 sent to our lending partner.\nNo late fee. All clear."}</Text>
      </View>

      {/* Aura Boost Card */}
      <View style={s.auraCard}>
        <View style={s.auraTopRow}>
          <Text style={s.auraTitle}>Aura</Text>
          <View style={s.auraBadge}>
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={YELLOW} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 19V5M5 12l7-7 7 7" />
            </Svg>
            <Text style={s.auraBadgeText}>+4 · 82 to 86</Text>
          </View>
        </View>

        <View style={s.auraTrack}>
          <View style={s.auraFill} />
        </View>

        <Text style={s.auraNote}>
          <Text style={s.auraNoteBold}>Why: </Text>
          You repaid on time, 4 in a row. One more moves your limit to ₹5,000.
        </Text>
      </View>

      {/* Bottom Buttons */}
      <View style={s.bottomActions}>
        <Pressable onPress={() => router.push("/(student)/aura")} style={s.auraBtn}>
          <Text style={s.auraBtnText}>See my Aura</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(student)/home")} style={s.doneBtn}>
          <Text style={s.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: YELLOW,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  radialGlow: {
    position: "absolute",
    left: "50%",
    top: 80,
    width: 520,
    height: 520,
    marginLeft: -260,
    borderRadius: 260,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 16,
    borderRadius: 3,
    backgroundColor: INK,
  },
  confettiWhite: {
    position: "absolute",
    width: 10,
    height: 16,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  centerSection: {
    marginTop: 70,
    alignItems: "center",
  },
  badgeWrap: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  rippleRing: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: "rgba(11,11,12,0.15)",
  },
  checkCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  title: {
    marginTop: 20,
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -2,
    lineHeight: 46,
    textAlign: "center",
    color: INK,
  },
  sub: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(11,11,12,0.72)",
    textAlign: "center",
  },
  auraCard: {
    marginTop: 28,
    padding: 18,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  auraTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  auraTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  auraBadge: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  auraBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: YELLOW,
  },
  auraTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(11,11,12,0.14)",
    overflow: "hidden",
  },
  auraFill: {
    width: "86%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: INK,
  },
  auraNote: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(11,11,12,0.75)",
  },
  auraNoteBold: {
    color: INK,
    fontWeight: "700",
  },
  bottomActions: {
    marginTop: "auto",
    gap: 8,
  },
  auraBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  auraBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  doneBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
});
