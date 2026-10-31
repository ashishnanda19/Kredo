"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Floating glass navigation bar. Gets more opaque once the page is scrolled so content
 * passing underneath never hurts readability. Sits below the fixed demo ribbon.
 */
export function GlassNav({ className, children }: { className?: string; children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-[var(--bar-h)] z-50 px-3 pt-3 sm:px-6">
      <div
        data-scrolled={scrolled}
        className={cn(
          "glass glass-nav pointer-events-auto mx-auto max-w-6xl rounded-full transition-[background-color,box-shadow] duration-300",
          "data-[scrolled=true]:[--glass-base:color-mix(in_oklab,var(--glass-solid)_90%,transparent)] data-[scrolled=true]:shadow-[0_14px_44px_-14px_rgba(0,0,0,0.8)]",
          className,
        )}
      >
        {children}
      </div>
    </header>
  );
}
