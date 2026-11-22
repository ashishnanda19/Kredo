import { View, Pressable, StyleSheet, PanResponder, Animated, Dimensions } from "react-native";
import { useState, useRef } from "react";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";
const SLIDER_WIDTH = Dimensions.get("window").width > 390 ? 342 : Dimensions.get("window").width - 48;
const THUMB_SIZE = 56;
const MAX_SLIDE = SLIDER_WIDTH - THUMB_SIZE - 8;

export default function Repay() {
  const [isPart, setIsPart] = useState(false);
  const [partAmt, setPartAmt] = useState(500);
  const pan = useRef(new Animated.Value(0)).current;
  const [complete, setComplete] = useState(false);

  const amount = isPart ? partAmt : 1150;
  const chips = [300, 500, 750];

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
              router.push("/(student)/repaid");
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
        <Text style={s.topTitle}>Repay</Text>
        <View style={s.spacer44} />
      </View>

      {/* Segment Toggle */}
      <View style={s.segmentWrap}>
        <View style={s.segment}>
          <View style={[s.segThumb, isPart ? s.segThumbPart : s.segThumbAll]} />
          <Pressable onPress={() => setIsPart(false)} style={s.segTab}>
            <Text style={[s.segText, !isPart ? s.segTextActive : s.segTextInactive]}>
              Everything due
            </Text>
          </Pressable>
          <Pressable onPress={() => setIsPart(true)} style={s.segTab}>
            <Text style={[s.segText, isPart ? s.segTextActive : s.segTextInactive]}>
              Part payment
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Hero Repaying Amount */}
      <View style={s.heroSection}>
        <Text style={s.heroLabel}>You are repaying</Text>
        <Text style={s.heroAmount}>₹{amount.toLocaleString("en-IN")}</Text>

        {isPart ? (
          <View style={s.chipRow}>
            {chips.map((val) => {
              const active = partAmt === val;
              return (
                <Pressable
                  key={val}
                  onPress={() => setPartAmt(val)}
                  style={[s.chip, active ? s.chipActive : s.chipInactive]}
                >
                  <Text style={[s.chipText, active ? s.chipTextActive : s.chipTextInactive]}>
                    ₹{val}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={s.heroNote}>Clears all 6 payments due 12 Nov. No late fee.</Text>
        )}

        <Text style={s.heroSubNote}>
          {isPart
            ? `₹${(1150 - partAmt).toLocaleString("en-IN")} stays due on 12 Nov.`
            : "Due 12 Nov, in 5 days."}
        </Text>
      </View>

      {/* Partner Notice Card */}
      <View style={s.noticeCard}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={s.noticeIcon}>
          <Path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />
        </Svg>
        <Text style={s.noticeText}>
          <Text style={s.noticeBold}>You pay the lending partner. </Text>
          We open their secure page to complete it. Kredo does not hold or move this money.
        </Text>
      </View>

      {/* Slide to Repay */}
      <View style={s.bottomSection}>
        <View style={s.sliderTrack}>
          <Animated.View
            style={[
              s.sliderFill,
              {
                width: Animated.add(pan, THUMB_SIZE + 8),
              },
            ]}
          />

          <View style={s.sliderLabelRow}>
            <Text style={s.sliderLabel}>Slide to repay</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Svg>
          </View>

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

        <Text style={s.footerNote}>Repaying on time helps your Aura and limit.</Text>
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
    top: 293,
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
  segmentWrap: {
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  segment: {
    position: "relative",
    height: 52,
    padding: 4,
    borderRadius: 26,
    backgroundColor: "#EFEDE6",
    flexDirection: "row",
  },
  segThumb: {
    position: "absolute",
    top: 4,
    width: "50%",
    height: 44,
    borderRadius: 22,
    backgroundColor: INK,
  },
  segThumbAll: {
    left: 4,
  },
  segThumbPart: {
    left: "50%",
  },
  segTab: {
    flex: 1,
    height: 44,
    borderRadius: 22,
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
    color: "#6B6B70",
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 16,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(11,11,12,0.62)",
  },
  heroAmount: {
    marginTop: 6,
    fontSize: 76,
    fontWeight: "800",
    letterSpacing: -4,
    lineHeight: 78,
    color: INK,
  },
  chipRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: INK,
    borderWidth: 1,
    borderColor: INK,
  },
  chipInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  chipTextInactive: {
    color: INK,
  },
  heroNote: {
    marginTop: 14,
    fontSize: 15,
    color: "rgba(11,11,12,0.62)",
  },
  heroSubNote: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(11,11,12,0.62)",
  },
  noticeCard: {
    marginHorizontal: 24,
    marginTop: 18,
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
