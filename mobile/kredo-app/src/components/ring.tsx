import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useAnimatedNumber } from "@/components/motion";

/**
 * Progress ring drawn from 12 o'clock, its arc sweeping in on mount like the
 * designs' `.ring` animation (stroke-dashoffset from the full length).
 */
export function Ring({
  size,
  r,
  width,
  pct,
  color = "#0B0B0C",
  track = "rgba(255,255,255,0.5)",
  duration = 1500,
  delay = 0.25,
}: {
  size: number;
  r: number;
  width: number;
  pct: number;
  color?: string;
  track?: string;
  duration?: number;
  delay?: number;
}) {
  const len = 2 * Math.PI * r;
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, {
      toValue: 1,
      duration,
      delay: delay * 1000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [v, duration, delay]);
  const c = size / 2;
  const t = useAnimatedNumber(v);
  const offset = len * (1 - (pct / 100) * t);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <Circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={width} />
      <Circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={`${len}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${c} ${c})`}
      />
    </Svg>
  );
}
