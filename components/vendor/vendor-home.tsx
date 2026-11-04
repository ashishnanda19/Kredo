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

const FEED = 6;

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
      <GlassCard radius="xl" className="theme-light !border-0 !bg-accent p-5 text-[#0b0b0c] !shadow-none sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#0b0b0c]/65">{VENDOR.today}</p>
        <p data-testid="received-today" className="mt-1 text-5xl font-semibold tabular-nums tracking-[-0.04em]">{today.coins} <span className="text-lg font-semibold text-[#0b0b0c]/65">{VENDOR.coins}</span></p>
        <p data-testid="payments-today" className="mt-1 text-sm text-[#0b0b0c]/70">{VENDOR.paymentsToday(today.count)}</p>
        <div className="mt-4" role="img" aria-label={VENDOR.dailyCap(today.coins, vendor.dailyCap)}>
          <span className="block h-2 overflow-hidden rounded-full bg-[#0b0b0c]/15"><span className="block h-full rounded-full bg-[#0b0b0c]" style={{ width: `${pct}%` }} /></span>
          <p className="mt-1.5 text-xs text-[#0b0b0c]/70">{VENDOR.dailyCap(today.coins, vendor.dailyCap)}</p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard radius="lg" className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">{VENDOR.awaiting}</p>
          <p data-testid="awaiting" className="mt-1 text-xl font-semibold tabular-nums tracking-[-0.02em]">{awaiting} {VENDOR.coins}</p>
          <p data-testid="settlement-line" className="mt-1 text-xs leading-snug text-ink-2">{settlementStatusLine(world, vendorId)}</p>
        </GlassCard>
        <GlassCard radius="lg" className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">{VENDOR.settledWeek}</p>
          <p data-testid="settled-week" className="mt-1 text-xl font-semibold tabular-nums tracking-[-0.02em]">{settledWeek} {VENDOR.coins}</p>
          <p className="mt-1 text-xs leading-snug text-ink-2">{VENDOR.awaitingHint}</p>
        </GlassCard>
      </div>
      <GlassButton asChild size="lg" className="w-full"><Link href="/vendor/qr"><QrCode className="size-5" aria-hidden /> {VENDOR.nav.qr}</Link></GlassButton>

      <GlassCard radius="lg" className="p-4 sm:p-5">
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
                <motion.li key={l.id} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-fresh={now - l.createdAt < 120_000} className={now - l.createdAt < 120_000 ? "animate-[row-flash_1.8s_ease-out] rounded-xl px-2" : undefined}>
                  <PaymentRow world={world} loan={l} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        <Link href="/vendor/payments" className="mt-2 inline-block text-sm font-semibold underline">{VENDOR.nav.payments}</Link>
      </GlassCard>
      <nav aria-label="More" className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
        <Link href="/vendor/insights" className="inline-flex min-h-11 items-center underline">{VENDOR.nav.insights}</Link>
        <Link href="/vendor/disputes" className="inline-flex min-h-11 items-center underline">Refunds</Link>
        <Link href="/vendor/support" className="inline-flex min-h-11 items-center underline">Support</Link>
      </nav>
    </div>
  );
}
