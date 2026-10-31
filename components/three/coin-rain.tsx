"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Confetti } from "@/components/verify/confetti";
import { usePrefersReducedMotion, useQuality } from "@/lib/quality";
import type { Tier } from "@/lib/theme";

// WebGL is lazy and client-only; the shower is never part of first paint.
const CoinShower = dynamic(() => import("./coin-shower"), { ssr: false });

// safety net only: the shower normally ends itself by simulated time (see coin-shower.tsx)
const LIFETIME_MS = 12000;

function Shower({ tier }: { tier: Tier }) {
  const [alive, setAlive] = useState(true);

  // everything (canvas, geometries, materials) is unmounted and freed when the show ends
  useEffect(() => {
    const id = setTimeout(() => setAlive(false), tier === "low" ? 4800 : LIFETIME_MS);
    return () => clearTimeout(id);
  }, [tier]);

  if (!alive) return null;
  // low tier: lighter CSS confetti, no physics
  if (tier === "low") return <Confetti />;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[85]">
      <CoinShower tier={tier} count={tier === "high" ? 110 : 60} onDone={() => setAlive(false)} />
    </div>
  );
}

/**
 * Coin shower for the limit unlock. Increase `trigger` (1, 2, 3...) to fire it; each value remounts
 * a fresh shower. Respects reduced motion (renders nothing) and the adaptive quality tier.
 */
export function CoinRain({ trigger }: { trigger: number }) {
  const tier = useQuality();
  const reduce = usePrefersReducedMotion();
  if (!trigger || reduce) return null;
  return <Shower key={trigger} tier={tier} />;
}
