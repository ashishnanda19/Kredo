import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, G } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import { useAnimatedNumber } from "@/components/motion";

// Matches the Claude Design artboard "Splash" (Splash.dc.html), timings included.


const STEM = 430; // M371 355V785
const ARMS = 496; // M605 396 440 560 620 752
const SWOOSH = 82;
const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const SPRING = Easing.bezier(0.34, 1.56, 0.64, 1);

function useTimeline(delay: number, duration: number, easing = OUT_EXPO, native = true) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, delay: delay * 1000, duration: duration * 1000, easing, useNativeDriver: native });
    a.start();
    return () => a.stop();
  }, [v, delay, duration, easing, native]);
  return v;
}

function useLoop(duration: number, delay = 0, alternate = true) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ease = Easing.inOut(Easing.ease);
    const seq = alternate
      ? Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: duration * 1000, easing: ease, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: duration * 1000, easing: ease, useNativeDriver: true }),
        ])
      : Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: duration * 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]);
    const loop = Animated.loop(seq);
    const t = setTimeout(() => loop.start(), delay * 1000);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [v, duration, delay, alternate]);
  return v;
}

function KMark() {
  const stem = useAnimatedNumber(useTimeline(0.3, 0.8, IN_OUT, false));
  const arms = useAnimatedNumber(useTimeline(0.7, 0.9, IN_OUT, false));
  const fill = useAnimatedNumber(useTimeline(1.15, 0.5, Easing.ease, false));
  const dot = useAnimatedNumber(useTimeline(1.5, 0.9, SPRING, false));
  const dotY = 213 + 80 * dot; // drops 80 into place
  const dotR = Math.max(0, 19 + 45 * dot); // grows from 0.3x
  const dotO = Math.min(1, dot / 0.3);

  const layer = (color: string) => (
    <>
      <Path d="M371 355V785" strokeDasharray={`${STEM}`} strokeDashoffset={STEM * (1 - stem)} />
      <Path d="M371 400 500 570 371 740Z" fill={color} strokeWidth={40} opacity={fill} />
      <Path d="M605 396 440 560 620 752" strokeDasharray={`${ARMS}`} strokeDashoffset={ARMS * (1 - arms)} />
    </>
  );

  return (
    <Svg width={190} height={249} viewBox="300 225 480 630" style={{ overflow: "visible" }}>
      <G transform="translate(16 20)" fill="none" stroke="#D5AF1E" strokeWidth={130} strokeLinecap="round" strokeLinejoin="round" opacity={0.55}>
        {layer("#D5AF1E")}
        <Circle cx={712} cy={dotY} r={dotR} fill="#D5AF1E" stroke="none" opacity={dotO} />
      </G>
      <G fill="none" stroke="#0B0B0C" strokeWidth={130} strokeLinecap="round" strokeLinejoin="round">
        {layer("#0B0B0C")}
      </G>
      <Circle cx={712} cy={dotY} r={dotR} fill="#0B0B0C" opacity={dotO} />
    </Svg>
  );
}

function Letter({ ch, delay }: { ch: string; delay: number }) {
  const v = useTimeline(delay, 0.95, Easing.bezier(0.34, 1.3, 0.5, 1));
  return (
    <View style={s.mask}>
      <Animated.View
        style={{
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [83, 0] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["6deg", "0deg"] }) },
          ],
        }}
      >
        <Text style={s.letter}>{ch}</Text>
      </Animated.View>
    </View>
  );
}

export default function Splash() {
  const router = useRouter();
  const go = () => router.replace("/(auth)/welcome");

  useEffect(() => {
    const t = setTimeout(go, 8500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glow = useLoop(4);
  const bob = useLoop(4.5, 3);
  const tag = useTimeline(2.4, 0.9);
  const swooshT = useAnimatedNumber(useTimeline(3.2, 1, Easing.bezier(0.65, 0, 0.25, 1), false));
  const pill = useTimeline(4.0, 0.7);
  const halo = useLoop(2.2, 4.7, false);
  const nudge = useLoop(0.7);

  return (
    <Pressable onPress={go} style={{ flex: 1 }} accessibilityLabel="Continue to sign up">
      <LinearGradient colors={["#F7DC3E", "#F5D832", "#F2D12A"]} locations={[0, 0.55, 1]} style={s.root}>
        <Animated.View
          style={[
            s.glowWrap,
            {
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }],
            },
          ]}
        >
          <Glow
            style={StyleSheet.absoluteFill}
            stops={[
              { offset: 0, color: "rgba(255,244,200,0.95)" },
              { offset: 0.4, color: "rgba(255,226,140,0.5)" },
              { offset: 0.7, color: "rgba(255,214,110,0.14)" },
              { offset: 1, color: "rgba(255,214,110,0)" },
            ]}
          />
        </Animated.View>

        <Animated.View
          style={[s.kWrap, { transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }]}
        >
          <KMark />
        </Animated.View>

        <View style={s.wordWrap}>
          <View style={s.word} accessibilityRole="image" accessibilityLabel="Kredo">
            {["K", "r", "e", "d", "o"].map((ch, i) => (
              <Letter key={ch} ch={ch} delay={1.7 + i * 0.08} />
            ))}
          </View>
          <Animated.View
            style={{
              marginTop: 22,
              opacity: tag,
              transform: [{ translateY: tag.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              flexDirection: "row",
              alignItems: "baseline",
            }}
          >
            <Text style={s.tag}>Pay on your phone, settle </Text>
            <View>
              <Text style={[s.tag, s.tagStrong]}>on time.</Text>
              <Svg width={82} height={12} viewBox="0 0 82 12" style={s.swoosh}>
              <Path
                d="M2 4.2 C16 9.6, 38 9.8, 56 6.6 S 74 2.4, 80 3.4"
                fill="none"
                stroke="#0B0B0C"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeDasharray={`${SWOOSH}`}
                strokeDashoffset={SWOOSH * (1 - swooshT)}
                opacity={swooshT > 0 ? 1 : 0}
              />
              </Svg>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            s.pillWrap,
            {
              opacity: pill,
              transform: [
                { translateY: pill.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                { scale: pill.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
              ],
            },
          ]}
        >
          <View>
            <Animated.View
              style={[
                s.halo,
                {
                  opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
                  transform: [
                    { scaleX: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) },
                    { scaleY: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) },
                  ],
                },
              ]}
            />
            <View style={s.pill}>
              <Text style={s.pillText}>Tap to continue</Text>
              <View style={s.pillArrow}>
                <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) }] }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0B0B0C" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 12h14M13 6l6 6-6 6" />
                  </Svg>
                </Animated.View>
              </View>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  glowWrap: { position: "absolute", left: "50%", top: 18, width: 600, height: 600, marginLeft: -300 },
  kWrap: { position: "absolute", left: 0, right: 0, top: 204, alignItems: "center" },
  wordWrap: { position: "absolute", left: 0, right: 0, top: 520, alignItems: "center" },
  word: { flexDirection: "row", justifyContent: "center" },
  mask: { overflow: "hidden", paddingTop: 4, paddingHorizontal: 1, paddingBottom: 10, marginTop: -4, marginHorizontal: -1, marginBottom: -10 },
  letter: { fontFamily: "Fredoka", fontWeight: "700", fontSize: 72, lineHeight: 72, color: "#0B0B0C" },
  tag: { fontSize: 18, fontWeight: "500", letterSpacing: -0.22, color: "rgba(11,11,12,0.78)", textAlign: "center" },
  tagStrong: { fontWeight: "600", color: "#0B0B0C" },
  swoosh: { position: "absolute", left: -1, bottom: -9, overflow: "visible" },
  pillWrap: { position: "absolute", left: 0, right: 0, bottom: 44, alignItems: "center" },
  halo: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: "#0B0B0C" },
  pill: {
    height: 48,
    paddingLeft: 22,
    paddingRight: 12,
    borderRadius: 24,
    backgroundColor: "#0B0B0C",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 13,
    elevation: 8,
  },
  pillText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  pillArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F5D832", alignItems: "center", justifyContent: "center" },
});
