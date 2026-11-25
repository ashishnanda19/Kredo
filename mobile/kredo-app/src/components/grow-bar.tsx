import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

/** Progress bar whose fill grows in from zero, like the designs' `.bar` (1.1s, 0.35s delay). */
export function GrowBar({
  pct,
  height = 6,
  track = "rgba(11,11,12,0.14)",
  fill = "#0B0B0C",
  delay = 0.35,
}: {
  pct: number;
  height?: number;
  track?: string;
  fill?: string;
  delay?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, {
      toValue: pct,
      duration: 1100,
      delay: delay * 1000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [v, pct, delay]);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: "hidden" }}>
      <Animated.View
        style={{
          height: "100%",
          borderRadius: height / 2,
          backgroundColor: fill,
          width: v.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
}
