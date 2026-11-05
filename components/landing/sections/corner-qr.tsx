"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

const INK = "#0b0b0c";
const YELLOW = "#F5D832";

/**
 * A scannable QR to this site, drawn in the same style as the QR on the landing page's counter stand: black modules,
 * rounded finder squares and a yellow centre tile. Error correction is high, so the centre tile costs nothing.
 */
function SiteQr({ url, className }: { url: string; className?: string }) {
  const m = useMemo(() => QRCode.create(url, { errorCorrectionLevel: "H" }).modules, [url]);
  const n = m.size;
  const inFinder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const c0 = Math.floor(n / 2) - 3;
  const inCentre = (x: number, y: number) => x >= c0 && x <= c0 + 6 && y >= c0 && y <= c0 + 6;
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m.get(x, y) && !inFinder(x, y) && !inCentre(x, y)) d += `M${x} ${y}h1v1h-1z`;
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width="6" height="6" rx="1.6" fill="none" stroke={INK} strokeWidth="1" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.8" fill={INK} />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label="QR code that opens Kredo" className={cn("block", className)} shapeRendering="crispEdges">
      <path d={d} fill={INK} />
      {eye(0, 0)}
      {eye(n - 7, 0)}
      {eye(0, n - 7)}
      <rect x={c0} y={c0} width="7" height="7" rx="1.8" fill="#fff" />
      <rect x={c0 + 1} y={c0 + 1} width="5" height="5" rx="1.3" fill={YELLOW} />
    </svg>
  );
}

/** The official Google Play badge (public/brand/google-play-badge.png). It goes to the landing page. */
function PlayStoreButton({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Get it on Google Play"
      className={cn("block transition-[transform,filter] duration-300 hover:-translate-y-0.5 hover:drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]", className)}
    >
      <Image src="/brand/google-play-badge.png" alt="" width={564} height={168} priority={false} className="h-[44px] w-auto" />
    </Link>
  );
}

/**
 * Two small fixed items on wide screens: a QR card at the bottom left (it hides near the footer so it never covers it)
 * and a store badge at the top right (it appears once the page is scrolled, so it never sits on the opening screen's own
 * header buttons). Both open this landing page.
 */
export function CornerQr() {
  // the site's own address, known only in the browser (null while rendering on the server)
  const url = useSyncExternalStore(
    () => () => {},
    () => `${window.location.origin}/`,
    () => null,
  );
  const [nearFooter, setNearFooter] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setNearFooter(window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 620);
        setScrolled(window.scrollY > 320);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!url) return null;
  const ease = [0.16, 1, 0.3, 1] as const;
  const shown = { opacity: 1, y: 0 };
  const hidden = { opacity: 0, y: 12 };

  return (
    <>
      {/* bottom left */}
      <motion.aside
        initial={hidden}
        animate={nearFooter ? hidden : shown}
        transition={{ duration: 0.6, ease, delay: nearFooter ? 0 : 1 }}
        aria-label="Download the app"
        className={cn("fixed bottom-5 left-5 z-[60] hidden w-[96px] rounded-[16px] bg-white p-2 text-[#0b0b0c] shadow-[0_20px_50px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/[.07] lg:block print:hidden", nearFooter && "pointer-events-none")}
      >
        <Link href="/" aria-label="Open Kredo" className="block rounded-[10px] bg-[#faf9f5] p-1.5 ring-1 ring-black/[.06] transition-transform duration-300 hover:scale-[1.04]">
          <SiteQr url={url} className="aspect-square w-full" />
        </Link>
        <p className="mt-1.5 text-center text-[10px] font-semibold leading-tight tracking-[-0.01em]">Download app</p>
      </motion.aside>

      {/* top right: just the small badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={scrolled ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.5, ease }}
        className={cn("fixed right-6 top-6 z-[60] hidden min-[1360px]:block print:hidden", !scrolled && "pointer-events-none")}
      >
        <PlayStoreButton />
      </motion.div>
    </>
  );
}
