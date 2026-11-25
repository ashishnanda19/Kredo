import { View, Pressable, StyleSheet, Dimensions } from "react-native";
import { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import { FadeSlide, Breathe } from "@/components/motion";
import { Shine } from "@/components/shine";
import { GrowBar } from "@/components/grow-bar";
import { LinearGradient } from "expo-linear-gradient";
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
    }, 3400);
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
      <Glow style={s.radialGlow} />

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
        <FadeSlide index={0} active={slide}>
          <View style={s.slideFill}>
            <Breathe scale={1} lift={10} duration={5000} style={s.cardFloat}>
              <LinearGradient
                colors={["#F8E782", "#F1DD6A", "#E6C93C"]}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.creditCard}
              >
                <Shine width={60} height={240} top={-20} />
                <View style={s.cardTopRow}>
                  <Text style={s.cardBrand}>Kredo card</Text>
                  <Text style={s.cardNumber}>•••• 0042</Text>
                </View>
                <Text style={s.cardLabel}>Available to spend</Text>
                <Text style={s.cardBalance}>₹3,000</Text>
              </LinearGradient>
            </Breathe>

            {/* Floating vendor badge */}
            <Breathe scale={1} lift={10} duration={6500} style={s.floatBadgePos}>
              <View style={s.floatBadge}>
                <View style={s.badgeIcon}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2" />
                  </Svg>
                </View>
                <Text style={s.badgeText}>Campus Cafe  ₹120</Text>
              </View>
            </Breathe>
          </View>
        </FadeSlide>

        {/* Slide 1: Receipt breakdown */}
        <FadeSlide index={1} active={slide} style={s.slideTop36}>
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
              <View style={{ marginTop: 18 }}>
                <GrowBar pct={100} height={6} track="transparent" fill="#E3CB4A" delay={0.4} />
              </View>
            </View>
            <Breathe scale={1} lift={10} duration={6500} style={s.noHiddenPos}>
              <View style={s.noHidden}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12.5l4.5 4.5L19 7" />
                </Svg>
                <Text style={s.noHiddenText}>No hidden charges</Text>
              </View>
            </Breathe>
          </View>
        </FadeSlide>

        {/* Slide 2: Aura Ring */}
        <FadeSlide index={2} active={slide} style={s.slideTop24}>
          <View style={s.slide2Wrap}>
            <View style={s.auraRingBox}>
              <Svg width={220} height={220} viewBox="0 0 220 220">
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
                  transform="rotate(-90 110 110)"
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
        </FadeSlide>
      </View>

      {/* Copy / Headings */}
      <View style={s.copySection}>
        <View style={s.copyBox}>
          {copy.map((c, i) => (
            <FadeSlide key={i} index={i} active={slide}>
              <Text style={s.copyTitle}>{c.title}</Text>
            </FadeSlide>
          ))}
        </View>

        {/* Carousel Dots */}
        <View style={s.dotRow}>
          {[0, 1, 2].map((idx) => (
            <Pressable
              key={idx}
              onPress={() => setSlide(idx)} accessibilityLabel={`Slide ${idx + 1}`}
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
          <Shine width={50} height={60} strength={0.18} period={5500} delay={1200} sweep={0.35} />
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
  slideTop36: { alignItems: "center", paddingTop: 36 },
  slideTop24: { alignItems: "center", paddingTop: 24 },
  illusContainer: {
    marginTop: 36,
    height: 372,
    justifyContent: "center",
    alignItems: "center",
  },
  slide0Wrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  slideFill: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  noHiddenPos: { position: "absolute", right: 26, top: 270 },
  noHidden: {
    height: 44,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 22,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "rgb(27,107,58)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  noHiddenText: { fontSize: 13, fontWeight: "800", color: "#1B6B3A" },
  cardFloat: { position: "absolute", left: 49, top: 40 },
  floatBadgePos: { position: "absolute", left: 30, top: 236 },
  creditCard: {
    width: 292,
    height: 184,
    borderRadius: 28,
    overflow: "hidden",
    padding: 20,
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
    height: 48,
    paddingLeft: 10,
    paddingRight: 16,
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
    lineHeight: 56,
    letterSpacing: -2.97,
    fontWeight: "800",
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
    width: 220,
    height: 220,
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
    lineHeight: 46,
    letterSpacing: -2.64,
    fontWeight: "800",
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
    paddingTop: 4,
  },
  copyBox: {
    height: 92,
  },
  copyTitle: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.9,
    lineHeight: 40,
    marginLeft: -1,
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
    marginTop: 18,
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 32,
    paddingHorizontal: 24,
  },
  ctaBtn: {
    overflow: "hidden",
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
    marginTop: 12,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
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
