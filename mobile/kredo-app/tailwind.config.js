/** @type {import('tailwindcss').Config} */
module.exports = {
  // "media" avoids react-native-css-interop race condition on web
  // (the app is light-only — no dark mode toggle)
  darkMode: "media",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0C",
        yellow: "#F8DE45",
        "yellow-dark": "#F4D52F",
        "yellow-gold": "#E3CB4A",
        sheet: "#FAF9F6",
        card: "#FFFFFF",
        border: "#ECEAE4",
        borderSoft: "#F1EFE9",
        muted: "#6B6B70",
        mutedSoft: "#8A8A90",
        inkSoft: "rgba(11,11,12,0.6)",
        inkSoft2: "rgba(11,11,12,0.35)",
        green: "#2E9B57",
        greenBg: "#E3F2E8",
        amber: "#FBF3C4",
        cream: "#F1DD6A",
        creamSoft: "rgba(227,203,74,0.65)",
        red: "#A3261B",
        redBg: "#F9E1DE",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Fredoka", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
        pill: "30px",
        chip: "16px",
        header: "34px",
        bottom: "36px",
      },
      spacing: {
        "xs": "6px",
        "sm": "10px",
        "md": "14px",
        "lg": "18px",
        "xl": "24px",
        "2xl": "32px",
      },
    },
  },
  plugins: [],
};
