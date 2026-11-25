import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

/**
 * Success-screen effects from the designs (Paid, Repaid, Payment received):
 * a one-off confetti burst that flies out and fades (`.c` / `conf`) and a
 * ring that keeps rippling out from the check (`.ripple`).
 */

export type Piece = { color: string; x: number; y: number; r: number; delay?: number };

function Bit({ p, base, ox, oy }: { p: Piece; base: number; ox: number; oy: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, {
      toValue: 1,
      duration: 1600,
      delay: (p.delay ?? base) * 1000,
      easing: Easing.bezier(0.2, 0.8, 0.3, 1),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [v, p.delay, base]);
  return (
    <Animated.View
      style={[
        s.bit,
        {
          left: ox,
          top: oy,
          backgroundColor: p.color,
          opacity: v.interpolate({ inputRange: [0, 0.001, 1], outputRange: [0, 1, 0] }),
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, p.y] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.r}deg`] }) },
          ],
        },
      ]}
    />
  );
}

/** Confetti bursting from (`x`, `y`) in screen points; `delay` is the default start in seconds. */
export function Confetti({ pieces, x = 195, y, delay = 0.45 }: { pieces: Piece[]; x?: number; y: number; delay?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Bit key={i} p={p} base={delay} ox={x} oy={y} />
      ))}
    </View>
  );
}

/** A 2px ink ring that scales to 1.9x and fades, forever. */
export function Ripple({ size, duration = 1.8, delay = 0.4 }: { size: number; duration?: number; delay?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: duration * 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => loop.start(), delay * 1000);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [v, duration, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: "#0B0B0C",
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
      }}
    />
  );
}

const s = StyleSheet.create({
  bit: { position: "absolute", width: 10, height: 16, borderRadius: 3 },
});
