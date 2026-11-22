import { View, Pressable, StyleSheet, PanResponder, Animated, Dimensions } from "react-native";
import { useState, useRef, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path, Circle } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";
const SLIDER_WIDTH = Dimensions.get("window").width > 390 ? 342 : Dimensions.get("window").width - 48;
const THUMB_SIZE = 56;
const MAX_SLIDE = SLIDER_WIDTH - THUMB_SIZE - 8;

export default function Pay() {
  const params = useLocalSearchParams();
  const rawAmount = parseInt((params["amount"] as string) || "120", 10);
  const fee = 5;
  const total = rawAmount + fee;

  const pan = useRef(new Animated.Value(0)).current;
  const [complete, setComplete] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (complete) return;
        const newX = Math.max(0, Math.min(MAX_SLIDE, gestureState.dx));
        pan.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (complete) return;
        if (gestureState.dx >= MAX_SLIDE * 0.75) {
          Animated.timing(pan, {
            toValue: MAX_SLIDE,
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            setComplete(true);
            setTimeout(() => {
              router.push("/(student)/paid");
            }, 300);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <View style={s.radialGlow} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={s.topTitle}>Confirm payment</Text>
        <View style={s.spacer44} />
      </View>

      {/* Stall Badge Card */}
      <View style={s.stallCard}>
        <View style={s.stallIconBox}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2" />
          </Svg>
        </View>
        <View style={s.stallInfo}>
          <Text style={s.stallName}>Campus Cafe</Text>
          <Text style={s.stallSub}>Canteen, Block B</Text>
        </View>
        <View style={s.verifiedBadge}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12.5l4.5 4.5L19 7" />
          </Svg>
          <Text style={s.verifiedText}>Verified</Text>
        </View>
      </View>

      {/* Hero Breakdown */}
      <View style={s.heroSection}>
        <Text style={s.heroLabel}>You will repay</Text>
        <Text style={s.heroTotal}>₹{total}</Text>
        <View style={s.pillRow}>
          <View style={s.whitePill}>
            <Text style={s.pillText}>₹{rawAmount} amount</Text>
          </View>
          <View style={s.whitePill}>
            <Text style={s.pillText}>₹{fee} fee</Text>
          </View>
          <View style={s.blackPill}>
            <Text style={s.blackPillText}>by 7 Dec</Text>
          </View>
        </View>
      </View>

      {/* Lending Notice */}
      <View style={s.noticeCard}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={s.noticeIcon}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 8v4l3 2" />
        </Svg>
        <Text style={s.noticeText}>
          <Text style={s.noticeBold}>Paid in 12 hours. </Text>
          Our lending partner pays Campus Cafe. You repay the lending partner, not Kredo.
        </Text>
      </View>

      {/* Slide to Pay */}
      <View style={s.bottomSection}>
        <View style={s.sliderTrack}>
          {/* Animated fill track */}
          <Animated.View
            style={[
              s.sliderFill,
              {
                width: Animated.add(pan, THUMB_SIZE + 8),
              },
            ]}
          />

          {/* Slider label */}
          <View style={s.sliderLabelRow}>
            <Text style={s.sliderLabel}>Slide to pay</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Svg>
          </View>

          {/* Animated draggable thumb */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              s.sliderThumb,
              {
                transform: [{ translateX: pan }],
              },
            ]}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Svg>
          </Animated.View>
        </View>

        <Text style={s.footerNote}>
          By sliding, you agree to repay ₹{total} by 7 Dec.
        </Text>
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
    top: 377,
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
    justifyContent: "space-between",
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
  topTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: INK,
  },
  spacer44: {
    width: 44,
  },
  stallCard: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  stallIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  stallInfo: {
    flex: 1,
  },
  stallName: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
  },
  stallSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  verifiedBadge: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1B6B3A",
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 26,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(11,11,12,0.62)",
  },
  heroTotal: {
    marginTop: 6,
    fontSize: 76,
    fontWeight: "800",
    letterSpacing: -4,
    lineHeight: 78,
    color: INK,
  },
  pillRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  whitePill: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: INK,
  },
  blackPill: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: INK,
    justifyContent: "center",
  },
  blackPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F5D832",
  },
  noticeCard: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  noticeIcon: {
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B6B70",
  },
  noticeBold: {
    color: INK,
    fontWeight: "700",
  },
  bottomSection: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  sliderTrack: {
    position: "relative",
    height: 64,
    borderRadius: 32,
    backgroundColor: INK,
    justifyContent: "center",
    overflow: "hidden",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 32,
    backgroundColor: "#E3CB4A",
  },
  sliderLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingLeft: 40,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sliderThumb: {
    position: "absolute",
    left: 4,
    top: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#F1DD6A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  footerNote: {
    marginTop: 12,
    fontSize: 12,
    color: "#6B6B70",
    textAlign: "center",
  },
});
