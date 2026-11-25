import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Confetti, Ripple, type Piece } from "@/components/celebrate";
import { Glow } from "@/components/glow";
import Svg, { Path } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";

// Same pieces and timings as the Claude Design artboard.
const CONFETTI: Piece[] = [
  { color: "#0B0B0C", x: -120, y: -150, r: 260 },
  { color: "#FFFFFF", x: 110, y: -170, r: -300, delay: 0.5 },
  { color: "#0B0B0C", x: 150, y: -70, r: 200, delay: 0.55 },
  { color: "#FFFFFF", x: -160, y: -60, r: -240, delay: 0.5 },
  { color: "#0B0B0C", x: 60, y: -200, r: 320, delay: 0.6 },
  { color: "#FFFFFF", x: -70, y: -190, r: -180, delay: 0.55 },
  { color: "#0B0B0C", x: -40, y: 120, r: 220, delay: 0.6 },
  { color: "#FFFFFF", x: 90, y: 110, r: -260, delay: 0.6 },
  { color: "#0B0B0C", x: 170, y: 30, r: 180, delay: 0.65 },
  { color: "#FFFFFF", x: -175, y: 40, r: -200, delay: 0.65 },
];

export default function Paid() {
  return (
    <View style={s.root}>
      {/* Background radial glow */}
      <Glow style={s.radialGlow} />

      {/* Confetti pieces */}
      <Confetti pieces={CONFETTI} y={238} delay={0.45} />

      {/* Center Success Badge & Text */}
      <View style={s.centerSection}>
        <View style={s.badgeWrap}>
          <Ripple size={112} duration={1.8} delay={0.4} />
          <View style={s.checkCircle}>
            <Svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke={YELLOW} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7" />
            </Svg>
          </View>
        </View>

        <Text style={s.title}>{"Paid.\nSorted."}</Text>
        <Text style={s.sub}>{"₹120 at Campus Cafe.\nRepay ₹125 by 7 Dec."}</Text>
      </View>

      {/* Bottom Buttons */}
      <View style={s.bottomActions}>
        <Pressable onPress={() => router.push("/(student)/receipt")} style={s.receiptBtn}>
          <Text style={s.receiptBtnText}>View receipt</Text>
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
    top: 120,
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
    marginTop: 150,
    alignItems: "center",
  },
  badgeWrap: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  rippleRing: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 2,
    borderColor: "rgba(11,11,12,0.15)",
  },
  checkCircle: {
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
    elevation: 8,
  },
  title: {
    marginTop: 24,
    fontSize: 46,
    fontWeight: "800",
    letterSpacing: -2.3,
    lineHeight: 47,
    textAlign: "center",
    color: INK,
  },
  sub: {
    marginTop: 24,
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(11,11,12,0.72)",
    textAlign: "center",
  },
  bottomActions: {
    marginTop: "auto",
    gap: 8,
  },
  receiptBtn: {
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
  receiptBtnText: {
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
