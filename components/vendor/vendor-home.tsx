"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { QrCode } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { VENDOR } from "@/lib/copy-demo";
import { DAY, istDate } from "@/lib/domain/time";
import { awaitingSettlement, loansOfVendor, receivedOn, settlementStatusLine } from "@/lib/domain/selectors";
import { useWorld } from "@/lib/store/world";
import { PaymentRow } from "./payment-row";

const FEED = 8;

/** The stall's home: today's coins, what's awaiting settlement, and a live feed that updates as students pay. */
export function VendorHome() {
  const world = useWorld((s) => s.world);
  const vendorId = useWorld((s) => s.session.vendorId);
  const vendor = vendorId ? world.vendors[vendorId] : undefined;
  if (!vendorId || !vendor) return null;

  const now = world.clock.now;
  const today = receivedOn(world, vendorId, istDate(now));
  const awaiting = awaitingSettlement(world, vendorId);
  const loans = loansOfVendor(world, vendorId);
  const settledWeek = loans.filter((l) => l.vendorStatus === "settled" && l.createdAt > now - 7 * DAY).reduce((s, l) => s + l.coins - l.refundedCoins, 0);
  const feed = [...loans].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id)).slice(0, FEED);
  const pct = Math.min(100, Math.round((today.coins / vendor.dailyCap) * 100));

  return (
    <div className="space-y-4">
      <GlassCard radius="xl" strength="strong" className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-2">{VENDOR.today}</p>
        <p data-testid="received-today" className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight">{today.coins} <span className="text-lg font-semibold text-ink-2">{VENDOR.coins}</span></p>
        <p data-testid="payments-today" className="mt-1 text-sm text-ink-2">{VENDOR.paymentsToday(today.count)}</p>
        <div className="mt-4" role="img" aria-label={VENDOR.dailyCap(today.coins, vendor.dailyCap)}>
          <span className="block h-1.5 overflow-hidden rounded-full bg-ink/15"><span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></span>
          <p className="mt-1.5 text-xs text-ink-2">{VENDOR.dailyCap(today.coins, vendor.dailyCap)}</p>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard radius="lg" className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-2">{VENDOR.awaiting}</p>
          <p data-testid="awaiting" className="mt-1 text-2xl font-bold tabular-nums">{awaiting} {VENDOR.coins}</p>
          <p data-testid="settlement-line" className="mt-1 text-sm text-ink-2">{settlementStatusLine(world, vendorId)}</p>
          <p className="mt-1 text-xs text-ink-2">{VENDOR.awaitingHint}</p>
        </GlassCard>
        <GlassCard radius="lg" className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-2">{VENDOR.settledWeek}</p>
          <p data-testid="settled-week" className="mt-1 text-2xl font-bold tabular-nums">{settledWeek} {VENDOR.coins}</p>
          <GlassButton asChild variant="secondary" size="sm" className="mt-3"><Link href="/vendor/qr"><QrCode className="size-4" aria-hidden /> {VENDOR.nav.qr}</Link></GlassButton>
        </GlassCard>
      </div>

      <GlassCard radius="lg" className="p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-bold">{VENDOR.feedTitle}</h2>
          <p className="text-xs text-ink-2">{VENDOR.feedLive}</p>
        </div>
        {feed.length === 0 ? (
          <p data-testid="feed-empty" className="py-6 text-center text-sm text-ink-2">{VENDOR.feedEmpty}</p>
        ) : (
          <ul data-testid="live-feed" className="mt-2 divide-y divide-hairline" aria-live="polite">
            <AnimatePresence initial={false}>
              {feed.map((l) => (
                <motion.li key={l.id} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <PaymentRow world={world} loan={l} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        <Link href="/vendor/payments" className="mt-2 inline-block text-sm font-semibold underline">{VENDOR.nav.payments}</Link>
      </GlassCard>
    </div>
  );
}
