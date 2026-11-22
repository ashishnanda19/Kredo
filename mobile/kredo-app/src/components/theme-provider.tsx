import { createContext, useContext, type ReactNode } from "react";
import { colors } from "@/lib/colors";

export const ThemeContext = createContext<{ colors: typeof colors } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={{ colors }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
