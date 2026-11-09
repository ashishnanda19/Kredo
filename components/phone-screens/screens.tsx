"use client";

import Image from "next/image";
import { Bell, Check, Clock, Coffee, IdCard, Printer, Sparkles, UtensilsCrossed } from "lucide-react";

/**
 * Phone screens on the site are captures of the real mobile app design (see mobile/PROGRESS.md), not redrawn UI.
 * Each capture is 780x1688 (2x of the 390x844 design size) in /public/app-screens.
 */
const SHOTS = {
  home: "Home: available to spend, shortcuts and this week's spending",
  reviewing: "ID review in progress",
  unlocked: "Limit unlocked",
  dues: "Dues: what is due and when",
  pay: "Confirm payment with the cost shown first",
  paid: "Payment done",
  "coins-due": "Coins due: what a repayment covers",
  receipt: "Receipt for a campus payment",
  passport: "Credit Passport",
  notifications: "Notifications",
  scan: "Scan or pick a nearby vendor",
  aura: "Aura score",
  repay: "Repay: everything due and the slider to repay",
  limit: "Your limit and the ladder",
} as const;

export type AppShotName = keyof typeof SHOTS;

/**
 * A capture of one mobile app screen. It fills whatever box the phone glass gives it (the 390x844 design box, or a slightly
 * shorter or taller one on the hero and scenes phones), so no strip of background shows at the top or bottom. The glass is
 * within a few percent of the design ratio, so the stretch is not visible.
 */
/** Screens that also have a dark-theme capture (public/app-screens/<name>-dark.png). */
const DARK_SHOTS = new Set<AppShotName>(["dues", "passport", "notifications"]);

/**
 * The captures are served as pre-sized WebP files (about 50 KB each) straight from /public, so a screen never waits on the
 * image optimiser when it first appears, and they are loaded eagerly so the scroll story never swaps in an empty screen.
 */
const shotUrl = (name: AppShotName, dark = false) => `/app-screens/${name}${dark ? "-dark" : ""}.webp`;

/** Fetch and decode screens ahead of time, so the first time one slides in there is no load or decode hitch. */
export function preloadAppShots(names: AppShotName[]) {
  if (typeof window === "undefined") return;
  for (const n of names) {
    for (const dark of DARK_SHOTS.has(n) ? [false, true] : [false]) {
      const img = new window.Image();
      img.decoding = "async";
      img.src = shotUrl(n, dark);
      img.decode?.().catch(() => {});
    }
  }
}

export function AppShot({ name, priority = false, dark = false }: { name: AppShotName; priority?: boolean; dark?: boolean }) {
  const hasDark = DARK_SHOTS.has(name);
  return (
    <div className="relative size-full select-none" aria-hidden>
      <Image src={shotUrl(name)} alt="" fill unoptimized loading="eager" decoding="async" priority={priority} draggable={false} className="object-fill" />
      {/* the dark capture fades in over the light one when the hero turns dark, so the screen follows the background */}
      {hasDark && (
        <Image
          src={shotUrl(name, true)}
          alt=""
          fill
          unoptimized
          loading="eager"
          decoding="async"
          draggable={false}
          className={`object-fill transition-opacity duration-700 ${dark ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

export function VerifyScreen({ phase = "pending" }: { phase?: "pending" | "accepted" }) {
  return <AppShot name={phase === "accepted" ? "unlocked" : "reviewing"} />;
}

export const LimitUnlockedScreen: (props: { active?: boolean; amount?: number }) => React.JSX.Element = () => <AppShot name="unlocked" />;

export function DuesListScreen({ dark = false }: { dark?: boolean }) {
  return <AppShot name="dues" dark={dark} />;
}

export function CampusPayScreen({ phase = "sheet" }: { phase?: "sheet" | "paid" }) {
  return <AppShot name={phase === "paid" ? "paid" : "pay"} />;
}

export function OfferScreen() {
  return <AppShot name="coins-due" />;
}

export function PayReceiptScreen() {
  return <AppShot name="receipt" />;
}

export function PassportScreen({ dark = false }: { dark?: boolean }) {
  return <AppShot name="passport" dark={dark} />;
}

/** The notification list from the app (the old lock-screen mock is gone, so the wallpaper prop is ignored). */
export const LockScreenReminders: (props: { wallpaper?: string; dark?: boolean }) => React.JSX.Element = ({ dark }) => <AppShot name="notifications" dark={dark} />;

/** Icons used by the landing notification feed (kept here so screens and feed share one look). */
export const FEED_ICONS = { Coffee, Printer, UtensilsCrossed, IdCard, Bell, Clock, Check, Sparkles };

export { SHOTS as APP_SHOT_ALTS };
