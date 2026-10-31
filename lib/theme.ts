/**
 * Central theme: colours, radii, shadows, easing and springs. CSS variables in app/globals.css mirror
 * these. Light-first; dark is used for scenes and as an alternative theme. One accent only.
 */

export const colors = {
  page: "#FFFFFF",
  soft: "#F6F5F3",
  card: "#F3F2F0",
  hairline: "rgba(0,0,0,0.08)",
  ink: "#0B0B0C",
  ink2: "#6B6B70",
  ink3: "#A1A1A8",
  dark: { page: "#06060A", card: "#101018", hairline: "rgba(255,255,255,0.10)" },
  indigo: { from: "#0A0620", to: "#1B0B5E", glow: "#6D4BFF" },
  /** the single accent (Flighty amber + Ramp lime merged). Change here + globals.css. */
  accent: "#F5D832",
  accentInk: "#111111",
  status: { green: "#22C55E", red: "#EF4444", amber: "#F59E0B", blue: "#2F7DF6" },
} as const;

/** Mood gradients: ONLY for the four tall feature cards and the glow-border card. */
export const moods = {
  navy: "linear-gradient(160deg,#0E1630 0%,#0A0F22 55%,#06070F 100%)",
  sunset: "linear-gradient(160deg,#2A1747 0%,#6B2A63 45%,#C2552F 100%)",
  ember: "linear-gradient(160deg,#3A0E07 0%,#8E2A12 50%,#E2572A 100%)",
  forest: "linear-gradient(160deg,#06140F 0%,#0C2A1E 55%,#0F3A2A 100%)",
  glowBorder: "linear-gradient(120deg,#7C5CFF,#E2489A 50%,#FF8A3D)",
} as const;

export const radii = { card: 14, bento: 16, tall: 24 } as const;

export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  gsapOut: "expo.out",
  gsapInOut: "power3.inOut",
};

export const duration = { micro: 0.12, ui: 0.24, card: 0.45, section: 0.7 } as const;

export const spring = {
  press: { type: "spring", stiffness: 400, damping: 32 } as const,
  soft: { type: "spring", stiffness: 400, damping: 32 } as const,
  sheet: { type: "spring", stiffness: 380, damping: 36 } as const,
  /** liquid-stretch indicator (low damping overshoots) */
  stretch: { type: "spring", stiffness: 420, damping: 26, mass: 0.9 } as const,
};

export type Tier = "high" | "mid" | "low";
