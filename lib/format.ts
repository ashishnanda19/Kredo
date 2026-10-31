import { CURRENCY_PREFIX } from "./config";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** formatINR(1150) -> "₹1,150"; formatINR(125000) -> "₹1,25,000". */
export function formatINR(amount: number): string {
  return `${CURRENCY_PREFIX}${inr.format(Math.round(amount))}`;
}

/**
 * All mock dates are anchored to this "today" so server and client render
 * identically (no hydration mismatches) and screenshots stay stable.
 */
export const MOCK_TODAY = new Date("2026-10-30T09:00:00+05:30");

const dayMs = 86_400_000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * dayMs);
}

export function daysUntil(iso: string | Date, from: Date = MOCK_TODAY): number {
  const target = typeof iso === "string" ? new Date(iso) : iso;
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((a - b) / dayMs);
}

const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const longDate = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

export function formatDate(iso: string | Date): string {
  return shortDate.format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatDateLong(iso: string | Date): string {
  return longDate.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** "Today", "Yesterday", or "28 Oct". */
export function relativeDay(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "Today";
  if (d === -1) return "Yesterday";
  return formatDate(iso);
}
