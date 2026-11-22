import { View, Pressable, StyleSheet, Dimensions } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, G } from "react-native-svg";
import { Text } from "@/components/ui/text";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const INK = "#0B0B0C";
const YELLOW = "#F5D832";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/welcome");
    }, 4500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Pressable
      onPress={() => router.replace("/(auth)/welcome")}
      style={styles.container}
    >
      {/* Background radial glow */}
      <View style={styles.glow} />

      {/* Center Kredo K Logo */}
      <View style={styles.logoWrap}>
        <Svg width={180} height={236} viewBox="300 225 480 630">
          {/* Shadow layer */}
          <G
            transform="translate(16, 20)"
            fill="none"
            stroke="#D5AF1E"
            strokeWidth={130}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.55}
          >
            <Path d="M371 355V785" />
            <Path d="M371 400 500 570 371 740Z" fill="#D5AF1E" strokeWidth={40} />
            <Path d="M605 396 440 560 620 752" />
            <Circle cx={712} cy={293} r={64} fill="#D5AF1E" stroke="none" />
          </G>
          {/* Main Ink layer */}
          <G
            fill="none"
            stroke={INK}
            strokeWidth={130}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M371 355V785" />
            <Path d="M371 400 500 570 371 740Z" fill={INK} strokeWidth={40} />
            <Path d="M605 396 440 560 620 752" />
          </G>
          <Circle cx={712} cy={293} r={64} fill={INK} />
        </Svg>
      </View>

      {/* Brand Name & Tagline */}
      <View style={styles.textWrap}>
        <Text style={styles.brandTitle}>Kredo</Text>
        <View style={styles.taglineWrap}>
          <Text style={styles.taglineText}>
            <Text style={{ color: "rgba(11,11,12,0.78)" }}>Pay on your phone, settle </Text>
            <Text style={{ fontWeight: "800", color: INK }}>on time.</Text>
          </Text>
          <Svg width={82} height={12} viewBox="0 0 82 12" style={styles.swooshSvg}>
            <Path
              d="M2 4.2 C16 9.6, 38 9.8, 56 6.6 S 74 2.4, 80 3.4"
              fill="none"
              stroke={INK}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </View>

      {/* Tap to continue pill */}
      <View style={styles.bottomWrap}>
        <View style={styles.pillButton}>
          <Text style={styles.pillText}>Tap to continue</Text>
          <View style={styles.arrowCircle}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Svg>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YELLOW,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: "rgba(255,244,200,0.6)",
    top: 100,
  },
  logoWrap: {
    marginTop: -40,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    marginTop: 32,
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 72,
    fontWeight: "800",
    color: INK,
    letterSpacing: -1,
  },
  taglineWrap: {
    position: "relative",
    marginTop: 14,
    alignItems: "center",
  },
  taglineText: {
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  swooshSvg: {
    position: "absolute",
    right: 0,
    bottom: -8,
  },
  bottomWrap: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
  },
  pillButton: {
    height: 48,
    paddingLeft: 22,
    paddingRight: 12,
    borderRadius: 24,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  pillText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
});
