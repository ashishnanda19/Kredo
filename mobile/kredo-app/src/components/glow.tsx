import { useId } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

/**
 * Soft radial glow, the native stand-in for the designs'
 * `radial-gradient(closest-side, colour, transparent)` circles.
 * `style` positions and sizes it; the fill comes from `color` (or `stops`).
 */

type GlowStop = { offset: number; color: string };

function parse(color: string): { rgb: string; alpha: number } {
  const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!m) return { rgb: color, alpha: 1 };
  return { rgb: `rgb(${m[1]},${m[2]},${m[3]})`, alpha: m[4] === undefined ? 1 : Number(m[4]) };
}

export function Glow({
  style,
  color,
  stops,
}: {
  style?: StyleProp<ViewStyle>;
  color?: string;
  stops?: GlowStop[];
}) {
  const id = `glow${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const flat = StyleSheet.flatten(style) ?? {};
  const fill = color ?? (typeof flat.backgroundColor === "string" ? flat.backgroundColor : "rgba(255,255,255,0.5)");
  const list: GlowStop[] = stops ?? [
    { offset: 0, color: fill },
    { offset: 1, color: fill.replace(/,\s*[\d.]+\s*\)$/, ",0)") },
  ];
  return (
    <View pointerEvents="none" style={[flat, { backgroundColor: "transparent", borderRadius: 0, overflow: "visible" }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            {list.map((s, i) => {
              const p = parse(s.color);
              return <Stop key={i} offset={s.offset} stopColor={p.rgb} stopOpacity={p.alpha} />;
            })}
          </RadialGradient>
        </Defs>
        <Ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
