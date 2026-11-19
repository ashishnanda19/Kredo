"use client";

import { useEffect } from "react";

/** Marks every landing section that is well off screen with `data-off`, so globals.css can pause its looping CSS animations (nothing animates unseen). */
export function OffscreenPause() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.removeAttribute("data-off");
          else e.target.setAttribute("data-off", "");
        }
      },
      { rootMargin: "200px 0px" },
    );
    document.querySelectorAll("main section, footer").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
