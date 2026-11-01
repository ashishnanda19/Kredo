"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QualityProvider } from "@/lib/quality";

/** Dark by default, class-based theming, motion respects prefers-reduced-motion, adaptive quality tiers. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <QualityProvider>
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        </QualityProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
