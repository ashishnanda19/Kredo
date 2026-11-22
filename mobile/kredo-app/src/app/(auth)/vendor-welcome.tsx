import { View, Pressable, StyleSheet, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function VendorWelcome() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % 3);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Yellow Glow */}
      <View style={styles.glow} />

      {/* Top Background Sheet */}
      <View style={styles.sheetBg} />

      {/* Role Segment Toggle */}
      <View style={styles.topBar}>
        <View style={styles.segmentWrap}>
          <Pressable
            onPress={() => router.push("/(auth)/welcome")}
            style={styles.segmentBtn}
          >
            <Text style={styles.segmentInactive}>Student</Text>
          </Pressable>
          <View style={styles.segmentActiveBtn}>
            <Text style={styles.segmentActive}>Vendor</Text>
          </View>
        </View>
      </View>

      {/* Carousel Showcase */}
      <View style={styles.carouselContainer}>
        {slide === 0 && (
          <View style={styles.slideWrap}>
            {/* Stall Card */}
            <View style={[styles.vendorCard, { transform: [{ rotate: "-3deg" }] }]}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarC}>
                  <Text style={styles.avatarText}>C</Text>
                </View>
                <Text style={styles.cafeTitle}>Campus Cafe</Text>
              </View>
              <View style={styles.qrBox}>
                <Svg width={140} height={140} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="3" width="7" height="7" rx="1.2" />
                  <Rect x="14" y="3" width="7" height="7" rx="1.2" />
                  <Rect x="3" y="14" width="7" height="7" rx="1.2" />
                  <Path d="M14 14h3v3h-3zM19 14h2M14 19h2M18 18h3v3h-3z" />
                </Svg>
                <View style={styles.scanline} />
              </View>
            </View>

            {/* Float Pill */}
            <View style={styles.floatPill1}>
              <View style={styles.eqWrap}>
                <View style={[styles.eqBar, { height: 14 }]} />
                <View style={[styles.eqBar, { height: 8 }]} />
                <View style={[styles.eqBar, { height: 12 }]} />
              </View>
              <Text style={styles.pillTextWhite}>+₹125 received</Text>
            </View>
          </View>
        )}

        {slide === 1 && (
          <View style={styles.slideWrap}>
            {/* Payout Timer Card */}
            <View style={styles.payoutCard}>
              <View style={styles.payoutTop}>
                <Text style={styles.payoutMeta}>Next payout in</Text>
                <View style={styles.badgeYellow}>
                  <Text style={styles.badgeYellowText}>12 hours</Text>
                </View>
              </View>
              <Text style={styles.timerDisplay}>11:59:59</Text>
              <View style={styles.timelineRows}>
                <View style={styles.timeRow}>
                  <View style={styles.dotCheck}>
                    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M5 12.5l4.5 4.5L19 7" />
                    </Svg>
                  </View>
                  <Text style={styles.timeBold}>1:42 pm</Text>
                  <Text style={styles.timeSub}>Student pays</Text>
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.dotRing} />
                  <Text style={styles.timeBold}>1:42 am</Text>
                  <Text style={styles.timeSub}>Partner pays you</Text>
                </View>
              </View>
            </View>

            {/* Float Pill */}
            <View style={styles.floatPill2}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12.5l4.5 4.5L19 7" />
              </Svg>
              <Text style={styles.pillTextGreen}>Straight to your bank</Text>
            </View>
          </View>
        )}

        {slide === 2 && (
          <View style={styles.slideWrap}>
            {/* Total Today Card */}
            <View style={styles.totalCard}>
              <Text style={styles.totalMeta}>Received today</Text>
              <Text style={styles.totalAmount}>₹185</Text>
              <Svg width={200} height={60} viewBox="0 0 190 80" style={styles.sparkSvg}>
                <Path d="M4 66 C24 64 34 50 56 52 S92 30 112 34 S150 12 184 10" fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" opacity={0.75} />
                <Circle cx="184" cy="10" r="5" fill={INK} />
              </Svg>
            </View>

            {/* Float Pill */}
            <View style={styles.floatPill3}>
              <View style={styles.avatarA}>
                <Text style={styles.avatarAText}>A</Text>
              </View>
              <Text style={styles.pillTextDark}>Aarav  +₹125</Text>
            </View>
          </View>
        )}
      </View>

      {/* Headings per slide */}
      <View style={styles.headingWrap}>
        <View style={{ height: 86 }}>
          {slide === 0 && (
            <Text style={styles.heroHeading}>
              <Text>Get paid by{"\n"}</Text>
              <Text>students, easily.</Text>
            </Text>
          )}
          {slide === 1 && (
            <Text style={styles.heroHeading}>
              <Text>Paid out{"\n"}</Text>
              <Text>12 hours later.</Text>
            </Text>
          )}
          {slide === 2 && (
            <Text style={styles.heroHeading}>
              <Text>See every{"\n"}</Text>
              <Text>payment live.</Text>
            </Text>
          )}
        </View>

        {/* Carousel Dots */}
        <View style={styles.dotsWrap}>
          {[0, 1, 2].map((i) => (
            <Pressable
              key={i}
              onPress={() => setSlide(i)}
              style={[
                styles.dot,
                slide === i ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom CTAs */}
      <View style={styles.bottomContainer}>
        <Pressable
          onPress={() => router.push("/(vendor)/details")}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Become a partner</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12h14M13 6l6 6-6 6" />
          </Svg>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={styles.loginBtn}
        >
          <Text style={styles.loginText}>
            <Text style={{ color: "#6B6B70" }}>Already with Kredo? </Text>
            <Text style={{ color: INK, fontWeight: "800" }}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  glow: {
    position: "absolute",
    left: "50%",
    top: -60,
    width: 460,
    height: 300,
    marginLeft: -230,
    borderRadius: 230,
    backgroundColor: "rgba(255,246,205,0.75)",
  },
  sheetBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 100,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: SHEET_BG,
    shadowColor: "rgba(120,90,0,0.45)",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  topBar: {
    paddingTop: 36,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  segmentWrap: {
    width: 236,
    height: 48,
    padding: 4,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.55)",
    flexDirection: "row",
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActiveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  segmentActive: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  segmentInactive: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(11,11,12,0.62)",
  },
  carouselContainer: {
    marginTop: 26,
    height: 340,
    alignItems: "center",
    justifyContent: "center",
  },
  slideWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  vendorCard: {
    width: 232,
    padding: 18,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarC: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#F1DD6A",
    fontSize: 14,
    fontWeight: "800",
  },
  cafeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  qrBox: {
    marginTop: 14,
    width: 196,
    height: 196,
    borderRadius: 18,
    backgroundColor: "#F4F2EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  scanline: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E3CB4A",
  },
  floatPill1: {
    position: "absolute",
    right: 28,
    bottom: 24,
    height: 46,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: 23,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  eqWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  eqBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#F1DD6A",
  },
  pillTextWhite: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  payoutCard: {
    width: 300,
    padding: 22,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  payoutTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  payoutMeta: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B6B70",
  },
  badgeYellow: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FBF3C4",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeYellowText: {
    fontSize: 11,
    fontWeight: "800",
    color: INK,
  },
  timerDisplay: {
    marginTop: 8,
    fontSize: 48,
    fontWeight: "800",
    color: INK,
    letterSpacing: -1,
  },
  timelineRows: {
    marginTop: 18,
    gap: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dotCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E3CB4A",
    alignItems: "center",
    justifyContent: "center",
  },
  dotRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 5,
    borderColor: "#E3CB4A",
  },
  timeBold: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  timeSub: {
    fontSize: 14,
    color: "#6B6B70",
  },
  floatPill2: {
    position: "absolute",
    right: 28,
    bottom: 20,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#1B6B3A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  pillTextGreen: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1B6B3A",
  },
  totalCard: {
    width: 300,
    height: 190,
    padding: 20,
    borderRadius: 30,
    backgroundColor: "#F1DD6A",
    shadowColor: "rgba(150,115,0,0.7)",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    position: "relative",
    overflow: "hidden",
  },
  totalMeta: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  totalAmount: {
    marginTop: 8,
    fontSize: 46,
    fontWeight: "800",
    color: INK,
    letterSpacing: -1,
  },
  sparkSvg: {
    position: "absolute",
    right: 12,
    bottom: 12,
  },
  floatPill3: {
    position: "absolute",
    left: 32,
    bottom: 24,
    height: 46,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 23,
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
  avatarA: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1DD6A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarAText: {
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },
  pillTextDark: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  headingWrap: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  heroHeading: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 40,
    color: INK,
  },
  dotsWrap: {
    marginTop: 18,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
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
  bottomContainer: {
    marginTop: "auto",
    paddingHorizontal: 24,
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
  loginBtn: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
