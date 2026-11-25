import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * The designs' `.shine`: a soft white band that sweeps across a card or button
 * (from -140% to 420% of its own width, skewed 18deg), then rests.
 * Put it inside a parent with `overflow: "hidden"`.
 */
export function Shine({
  width = 50,
  height = 60,
  top = 0,
  strength = 0.5,
  period = 4500,
  delay = 1000,
  sweep = 0.4,
}: {
  width?: number;
  height?: number;
  top?: number;
  strength?: number;
  period?: number;
  delay?: number;
  /** share of the period spent sweeping (designs use 0.35 or 0.4) */
  sweep?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: period * sweep, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(period * (1 - sweep)),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [v, period, delay, sweep]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        top,
        width,
        height,
        transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-1.4 * width, 4.2 * width] }) }, { skewX: "-18deg" }],
      }}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0)", `rgba(255,255,255,${strength})`, "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}
