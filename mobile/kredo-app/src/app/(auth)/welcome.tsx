import { View, Pressable, StyleSheet, Dimensions } from "react-native";
import { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path, Circle } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const YELLOW_DARK = "#F4D52F";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Welcome() {
  const [role, setRole] = useState<"student" | "vendor">("student");
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % 3);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const copy = [
    {
      title: "Pay at campus.\nSettle later.",
      sub: "Scan a stall QR or pick a vendor near you. Your lending partner pays the stall.",
    },
    {
      title: "Know the\ncost first.",
      sub: "The fee, total and due date come first. Nothing is hidden until later.",
    },
    {
      title: "Repay on time.\nLimit goes up.",
      sub: "Every on-time repayment can raise your limit, with a plain reason each time.",
    },
  ];

  return (
    <View style={s.root}>
      {/* Top radial & sheet backgrounds */}
      <View style={s.sheetBg} />
      <View style={s.radialGlow} />

      {/* Role Segment Toggle */}
      <View style={s.segmentWrap}>
        <View style={s.segment}>
          <View style={[s.segThumb, role === "vendor" ? s.segThumbVendor : s.segThumbStudent]} />
          <Pressable
            onPress={() => setRole("student")}
            style={s.segTab}
          >
            <Text style={[s.segText, role === "student" ? s.segTextActive : s.segTextInactive]}>
              Student
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setRole("vendor");
              router.push("/(auth)/vendor-welcome");
            }}
            style={s.segTab}
          >
            <Text style={[s.segText, role === "vendor" ? s.segTextActive : s.segTextInactive]}>
              Vendor
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Slide Illustration Area */}
      <View style={s.illusContainer}>
        {/* Slide 0: Tilted Card */}
        {slide === 0 && (
          <View style={s.slide0Wrap}>
            <View style={s.creditCard}>
              <View style={s.cardTopRow}>
                <Text style={s.cardBrand}>Kredo card</Text>
                <Text style={s.cardNumber}>•••• 0042</Text>
              </View>
              <Text style={s.cardLabel}>Available to spend</Text>
              <Text style={s.cardBalance}>₹3,000</Text>
            </View>

            {/* Floating vendor badge */}
            <View style={s.floatBadge}>
              <View style={s.badgeIcon}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2" />
                </Svg>
              </View>
              <Text style={s.badgeText}>Campus Cafe  ₹120</Text>
            </View>
          </View>
        )}

        {/* Slide 1: Receipt breakdown */}
        {slide === 1 && (
          <View style={s.slide1Wrap}>
            <View style={s.receiptCard}>
              <View style={s.receiptTopRow}>
                <Text style={s.receiptMuted}>You will repay</Text>
                <View style={s.receiptBadge}>
                  <Text style={s.receiptBadgeText}>by 7 Dec</Text>
                </View>
              </View>
              <Text style={s.receiptAmount}>₹125</Text>
              <View style={s.receiptRows}>
                <View style={s.receiptRow}>
                  <Text style={s.receiptRowLabel}>Amount</Text>
                  <Text style={s.receiptRowVal}>₹120</Text>
                </View>
                <View style={s.receiptDivider} />
                <View style={s.receiptRow}>
                  <Text style={s.receiptRowLabel}>Fee</Text>
                  <Text style={s.receiptRowVal}>₹5</Text>
                </View>
              </View>
              <View style={s.receiptBar}>
                <View style={s.receiptBarFill} />
              </View>
            </View>
          </View>
        )}

        {/* Slide 2: Aura Ring */}
        {slide === 2 && (
          <View style={s.slide2Wrap}>
            <View style={s.auraRingBox}>
              <Svg width={200} height={200} viewBox="0 0 220 220">
                <Circle cx="110" cy="110" r="54" fill="none" stroke="#F1EFE9" strokeWidth="12" />
                <Circle
                  cx="110"
                  cy="110"
                  r="54"
                  fill="none"
                  stroke="#E3CB4A"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="339"
                  strokeDashoffset="61"
                  rotation="-90"
                  origin="110, 110"
                />
              </Svg>
              <View style={s.auraScoreCenter}>
                <Text style={s.auraScoreNum}>82</Text>
                <Text style={s.auraScoreLabel}>Aura</Text>
              </View>
            </View>

            <View style={s.auraSteps}>
              <View style={s.auraStepInactive}>
                <Text style={s.auraStepText}>₹1,000</Text>
              </View>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
              <View style={s.auraStepActive}>
                <Text style={s.auraStepText}>₹3,000</Text>
              </View>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
              <View style={s.auraStepDark}>
                <Text style={s.auraStepDarkText}>₹5,000</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Copy / Headings */}
      <View style={s.copySection}>
        <View style={s.copyBox}>
          <Text style={s.copyTitle}>{copy[slide].title}</Text>
          <Text style={s.copySub}>{copy[slide].sub}</Text>
        </View>

        {/* Carousel Dots */}
        <View style={s.dotRow}>
          {[0, 1, 2].map((idx) => (
            <Pressable
              key={idx}
              onPress={() => setSlide(idx)}
              style={[s.dot, slide === idx ? s.dotActive : s.dotInactive]}
            />
          ))}
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={s.bottomCta}>
        <Pressable
          onPress={() => (role === "student" ? router.push("/(auth)/join") : router.push("/(auth)/vendor-welcome"))}
          style={s.ctaBtn}
        >
          <Text style={s.ctaBtnText}>Get started</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12h14M13 6l6 6-6 6" />
          </Svg>
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/login")} style={s.loginLink}>
          <Text style={s.loginText}>
            {"Already with Kredo? "}
            <Text style={s.loginBold}>Log in</Text>
          </Text>
        </Pressable>
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
    top: 100,
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
  segmentWrap: {
    paddingTop: 30,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  segment: {
    position: "relative",
    width: 236,
    height: 48,
    padding: 4,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.55)",
    flexDirection: "row",
  },
  segThumb: {
    position: "absolute",
    top: 4,
    width: 114,
    height: 40,
    borderRadius: 20,
    backgroundColor: INK,
  },
  segThumbStudent: {
    left: 4,
  },
  segThumbVendor: {
    left: 118,
  },
  segTab: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  segText: {
    fontSize: 14,
    fontWeight: "800",
  },
  segTextActive: {
    color: "#FFFFFF",
  },
  segTextInactive: {
    color: "rgba(11,11,12,0.62)",
  },
  illusContainer: {
    marginTop: 20,
    height: 330,
    justifyContent: "center",
    alignItems: "center",
  },
  slide0Wrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  creditCard: {
    width: 292,
    height: 180,
    borderRadius: 28,
    backgroundColor: "#F1DD6A",
    padding: 20,
    transform: [{ rotate: "-7deg" }],
    shadowColor: "rgba(150,115,0,0.7)",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardBrand: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  cardNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(11,11,12,0.55)",
    letterSpacing: 1,
  },
  cardLabel: {
    marginTop: 34,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(11,11,12,0.6)",
  },
  cardBalance: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.5,
    lineHeight: 44,
    color: INK,
  },
  floatBadge: {
    marginTop: 20,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },
  badgeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  slide1Wrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  receiptCard: {
    width: 300,
    padding: 22,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 22,
  },
  receiptTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptMuted: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B6B70",
  },
  receiptBadge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FBF3C4",
    justifyContent: "center",
  },
  receiptBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: INK,
  },
  receiptAmount: {
    marginTop: 8,
    fontSize: 54,
    fontWeight: "800",
    letterSpacing: -2,
    color: INK,
  },
  receiptRows: {
    marginTop: 16,
    gap: 8,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  receiptRowLabel: {
    fontSize: 14,
    color: "#6B6B70",
    fontWeight: "500",
  },
  receiptRowVal: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#F1EFE9",
    marginVertical: 4,
  },
  receiptBar: {
    marginTop: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F1EFE9",
    overflow: "hidden",
  },
  receiptBarFill: {
    width: "72%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#2E9B57",
  },
  slide2Wrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  auraRingBox: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  auraScoreCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  auraScoreNum: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -2,
    color: INK,
  },
  auraScoreLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#6B6B70",
  },
  auraSteps: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  auraStepInactive: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },
  auraStepActive: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F1DD6A",
    justifyContent: "center",
  },
  auraStepDark: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: INK,
    justifyContent: "center",
  },
  auraStepText: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  auraStepDarkText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  copySection: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  copyBox: {
    minHeight: 110,
  },
  copyTitle: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 40,
    color: INK,
  },
  copySub: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    color: "#6B6B70",
  },
  dotRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: INK,
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#D9D6CC",
  },
  bottomCta: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginTop: "auto",
  },
  ctaBtn: {
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
  ctaBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loginLink: {
    marginTop: 14,
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B6B70",
  },
  loginBold: {
    color: INK,
    fontWeight: "800",
  },
});
