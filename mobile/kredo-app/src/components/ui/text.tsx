import { createContext, useContext } from "react";
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from "react-native";

/**
 * App text. Screens style text with `style` (sizes and weights copied from the
 * Claude Design artboards), so the style always wins here. The weight is
 * turned into the matching loaded font file, because Android ignores
 * `fontWeight` on custom fonts and would fall back to the system font.
 */

const INTER: Record<string, string> = {
  "100": "Inter_400Regular",
  "200": "Inter_400Regular",
  "300": "Inter_400Regular",
  "400": "Inter_400Regular",
  normal: "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
  bold: "Inter_700Bold",
  "800": "Inter_800ExtraBold",
  "900": "Inter_800ExtraBold",
};

const FREDOKA: Record<string, string> = {
  "600": "Fredoka_600SemiBold",
  "700": "Fredoka_700Bold",
  "800": "Fredoka_700Bold",
  "900": "Fredoka_700Bold",
};

const presets = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: "800", letterSpacing: -1 },
  h2: { fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
  h3: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: "400" },
  label: { fontSize: 13, fontWeight: "600" },
  small: { fontSize: 12, fontWeight: "700" },
  caption: { fontSize: 11, fontWeight: "700" },
  muted: { fontSize: 13, fontWeight: "500", color: "#6B6B70" },
  captionMuted: { fontSize: 11, fontWeight: "700", color: "#8A8A90" },
});

const base: TextStyle = { color: "#0B0B0C", fontSize: 15 };

/** Picks the loaded font file for a style's weight (Inter, or Fredoka for display text). */
export function resolveFont(style: TextStyle): TextStyle {
  const weight = String(style.fontWeight ?? "400");
  const display = /fredoka|display/i.test(style.fontFamily ?? "");
  return {
    fontFamily: display ? (FREDOKA[weight] ?? "Fredoka_600SemiBold") : (INTER[weight] ?? "Inter_400Regular"),
    fontWeight: undefined,
  };
}

/** The enclosing text's resolved style, so nested text inherits like it does on the web. */
const ParentText = createContext<TextStyle | null>(null);

export function PresetText({
  kind,
  style,
  children,
  ...props
}: { kind?: keyof typeof presets; children?: React.ReactNode } & TextProps) {
  const parent = useContext(ParentText);
  const own = StyleSheet.flatten([kind ? presets[kind] : null, style]) as TextStyle;
  const merged = StyleSheet.flatten([parent ?? base, own]) as TextStyle;
  // Nested text only sets what it changes (plus its font file); the rest is inherited.
  const applied = parent ? [own, resolveFont(merged)] : [merged, resolveFont(merged)];
  return (
    <ParentText.Provider value={merged}>
      <RNText {...props} style={applied}>
        {children}
      </RNText>
    </ParentText.Provider>
  );
}

export { PresetText as Text };
