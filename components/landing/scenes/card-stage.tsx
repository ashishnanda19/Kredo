"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useGlTier } from "@/lib/quality";
import { cardRig, gaugeGl, rigReady } from "./card-rig";
import { RigCssCard } from "./rig-css-card";

// The 3D bundle is lazy and client-only: first paint never waits on it.
const LandingCanvas = dynamic(() => import("@/components/three/landing-canvas"), { ssr: false });

let webglSupport: boolean | null = null;
function supportsWebGL() {
  if (webglSupport === null) {
    try {
      const c = document.createElement("canvas");
      webglSupport = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

/**
 * Picks the renderer for the persistent card.
 *  - mid/high tier with WebGL: the R3F canvas (CSS card shows until its first frame)
 *  - low tier / no WebGL: the CSS 3D card driven by the same rig
 * Rendering pauses when the tab is hidden or nothing is visible.
 */
export function CardStage() {
  // "pending" until the page is loaded + idle and the GPU probe is done: 3D never competes with first paint
  const gl = useGlTier();
  const tier = gl === "pending" ? "low" : gl;
  const webgl = useSyncExternalStore(
    () => () => {},
    supportsWebGL,
    () => false,
  );
  const [glReady, setGlReady] = useState(false);
  // The CSS rig card only appears once the user starts scrolling: until then the inline hero poster is the
  // card, so the (text-bearing) scroll card can never become a late, larger LCP candidate.
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(true);

  const useGl = gl !== "pending" && tier !== "low" && webgl;

  useEffect(() => {
    gaugeGl.set(useGl && glReady);
    return () => gaugeGl.set(false);
  }, [useGl, glReady]);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 4) {
        setScrolled(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const check = () => {
      const visible = cardRig.pose.opacity > 0.01 || cardRig.gauge.visible;
      setActive(!document.hidden && visible);
    };
    const id = setInterval(check, 300);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return (
    <>
      {useGl && (
        <LandingCanvas
          tier={tier}
          active={active}
          onFirstFrame={() => {
            setGlReady(true);
            rigReady.set(true);
          }}
        />
      )}
      {scrolled && (!useGl || !glReady) && <RigCssCard />}
    </>
  );
}
