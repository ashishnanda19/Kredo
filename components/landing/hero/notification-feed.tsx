"use client";

import { ArrowUpRight, Bell, Check, Clock, FileText, Printer, Sparkles, Store, TrendingUp, UserRound, UtensilsCrossed } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

const ICONS = { doc: FileText, clock: Clock, check: Check, up: TrendingUp, offer: ArrowUpRight, avatar: UserRound, print: Printer, food: UtensilsCrossed, store: Store, spark: Sparkles, bell: Bell } as const;
const TONES = { blue: "#2F7DF6", amber: "#F59E0B", green: "#22C55E", violet: "#7C5CFF", neutral: "#6B6B70" } as const;

export type FeedStage = keyof typeof COPY.landing.feed;
type Item = (typeof COPY.landing.feed)[FeedStage][number];

/** Deterministic shuffle so the "lit" order is identical on server and client. */
function seededOrder(n: number, seed: number) {
  const idx = Array.from({ length: n }, (_, i) => i);
  let s = seed;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}
const ORDER: Record<FeedStage, number[]> = { verify: [0, 1, 2, 3, 4, 5], campus: seededOrder(6, 7), repay: seededOrder(6, 11) };
/** Verify reads as a sequence, so it lights in order; the others light in a scattered order. */
const rankOf = (stage: FeedStage) => {
  const r: number[] = [];
  ORDER[stage].forEach((item, rank) => (r[item] = rank));
  return r;
};

/** Cards sit on two gentle arcs either side of the phone: [side, top %, outward px]. */
const SLOTS: [("l" | "r"), number, number][] = [
  ["l", 6, 0], ["r", 12, 0],
  ["l", 30, 44], ["r", 36, 44],
  ["l", 54, 8], ["r", 60, 8],
];

/** `solid`: an opaque surface, for the phone-width banner that sits over the phone screen. */
export function FeedCard({ item, dark, lit = true, solid, className }: { item: Item; dark?: boolean; lit?: boolean; solid?: boolean; className?: string }) {
  const Icon = ICONS[item.icon as keyof typeof ICONS] ?? Bell;
  const c = TONES[item.tone as keyof typeof TONES] ?? TONES.neutral;
  return (
    <div
      className={cn(
        "flex w-[248px] items-center gap-3 rounded-[18px] p-3 transition-[transform,background-color,box-shadow,color] duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
        // unlit cards are dimmed through surface and colour, not opacity, so their text still meets contrast
        dark
          ? lit
            ? solid
              ? "scale-100 bg-[#1b1442] text-white ring-1 ring-white/15"
              : "scale-100 bg-white/[.1] text-white ring-1 ring-white/15"
            : "scale-[.96] bg-white/[.03] text-white/60 ring-1 ring-white/[.06]"
          : lit
            ? "scale-100 bg-elevated text-ink shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] ring-1 ring-hairline"
            : "scale-[.96] bg-soft text-ink-2 ring-1 ring-hairline",
        className,
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-[10px] transition-opacity duration-500", !lit && "opacity-35 grayscale")} style={{ background: `${c}1f`, color: c }}>
        <Icon className="size-[18px]" strokeWidth={2.2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold leading-tight">{item.title}</span>
        <span className={cn("block truncate pt-0.5 text-[12px]", dark ? "text-white/60" : "text-ink-2")}>{item.detail}</span>
      </span>
    </div>
  );
}

/**
 * L2: notification cards flanking the phone. `lit` (0..6) lights cards one by one in a seeded order as the
 * stage progresses. From lg up they sit on arcs either side (below lg see FeedBanner). Decorative (sample data), so hidden from assistive tech.
 */
export function NotificationFeed({ stage, lit, dark }: { stage: FeedStage; lit: number; dark?: boolean }) {
  const items = COPY.landing.feed[stage];
  const rank = rankOf(stage);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="hidden lg:block">
        {items.map((item, i) => {
          const [side, top, out] = SLOTS[i];
          const pos = `calc(50% + var(--pw) * 0.24 + 28px + ${out}px)`;
          return (
            <div key={`${stage}-${i}`} className="absolute anim-rise" style={{ top: `${top}%`, [side === "l" ? "right" : "left"]: pos, animationDelay: `${i * 40}ms` }}>
              <FeedCard item={item} dark={dark} lit={rank[i] < lit} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Below lg: the most recent card as a single banner in its own row between the copy and the phone,
 * so it never covers the phone screen. The row keeps its height so the phone does not jump.
 */
export function FeedBanner({ stage, lit, dark, className }: { stage: FeedStage | null; lit: number; dark?: boolean; className?: string }) {
  const items = stage ? COPY.landing.feed[stage] : null;
  const latest = stage ? ORDER[stage][Math.max(0, Math.min(6, lit) - 1)] : 0;
  return (
    <div aria-hidden className={cn("pointer-events-none flex h-[64px] w-full items-center justify-center px-4 lg:hidden", className)}>
      {items && lit > 0 && <FeedCard key={`${stage}-${latest}`} item={items[latest]} dark={dark} solid className="anim-rise w-[min(320px,calc(100vw-40px))] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)]" />}
    </div>
  );
}
