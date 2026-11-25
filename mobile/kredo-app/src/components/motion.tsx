import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

/**
 * Native versions of the motion classes used across the Claude Design
 * artboards: `.rise` (fade up on enter), `.pulse` (ring that grows and fades)
 * and `.pop` (scale in). Timings and curves are copied from the designs.
 */

const OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);

/** `.rise`: 0.7s, from 18px below and transparent. `delay` in seconds, like the designs' animation-delay. */
export function Rise({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration: 700, delay: delay * 1000, easing: OUT_EXPO, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [v, delay]);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

/** `.pulse`: a copy of the shape that grows to `scale` and fades, every 2.4s. */
export function Pulse({ style, scale = 1.5 }: { style?: StyleProp<ViewStyle>; scale?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.timing(v, { toValue: 1, duration: 2400, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          position: "absolute",
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }) }],
        },
      ]}
    />
  );
}

/** `.pop`: scale from 0.6 and fade in. */
export function Pop({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration: 500, delay: delay * 1000, easing: OUT_EXPO, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [v, delay]);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

/** `.breathe` / `.float`: an endless back-and-forth (scale to `scale`, or move up by `lift` px). */
export function Breathe({
  style,
  children,
  scale = 1.06,
  lift = 0,
  duration = 2000,
}: {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  scale?: number;
  lift?: number;
  duration?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ease = Easing.inOut(Easing.ease);
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: ease, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: ease, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [v, duration]);
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -lift] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Counts from 0 to `target` with an ease-out-cubic curve, like the designs' requestAnimationFrame count-ups. */
export function useCountUp(target: number, ms = 1100) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

/**
 * One carousel slide that cross-fades like the designs' `.slide`: the active one
 * is in place; earlier ones sit 40px left, later ones 40px right, at 96% scale.
 */
export function FadeSlide({
  index,
  active,
  style,
  children,
}: {
  index: number;
  active: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const target = index === active ? 0 : index < active ? -1 : 1;
  const v = useRef(new Animated.Value(target)).current;
  useEffect(() => {
    const a = Animated.timing(v, { toValue: target, duration: 700, easing: OUT_EXPO, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [v, target]);
  return (
    <Animated.View
      pointerEvents={index === active ? "auto" : "none"}
      style={[
        { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
        style,
        {
          opacity: v.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
          transform: [
            { translateX: v.interpolate({ inputRange: [-1, 0, 1], outputRange: [-40, 0, 40] }) },
            { scale: v.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.96, 1, 0.96] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Follows an Animated.Value as a plain number, for SVG props. Animated SVG
 * components leak a native-only prop to the DOM on web, so the rings and the
 * splash K re-render plain SVG elements from this value instead.
 */
export function useAnimatedNumber(v: Animated.Value | Animated.AnimatedInterpolation<number>, initial = 0) {
  const [n, setN] = useState(initial);
  useEffect(() => {
    const id = v.addListener(({ value }) => setN(value));
    return () => v.removeListener(id);
  }, [v]);
  return n;
}
