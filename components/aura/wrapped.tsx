"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { AURA } from "@/lib/copy-aura";
import type { AuraHistoryView, AuraView } from "@/lib/score/types";
import { useAura, useAuraHistory } from "@/lib/score/use-aura";
import { cn } from "@/lib/utils";
import { AuraSkeleton, NoScore, UnavailableBanner } from "./parts";

const W = AURA.wrapped;

type Card = { id: string; title: string; big: string; body?: string; share?: boolean };

function cardsFor(view: AuraView, history: AuraHistoryView | null): Card[] {
  const days = history?.days ?? [];
  const change = days.length > 1 ? days.at(-1)!.aura - days[0].aura : 0;
  const markers = history?.markers ?? [];
  const onTime = markers.filter((m) => m.kind === "repaid_early" || m.kind === "repaid_on_time").length;
  const peak = days.reduce((m, d) => Math.max(m, d.aura), 0);
  const best = markers.some((m) => m.kind === "level_up") ? W.best.levelUp : markers.some((m) => m.kind === "repaid_early") ? W.best.early : peak ? W.best.peak(peak) : W.best.none;
  const tip = view.holdbacks[0]?.action.label ?? W.tip.fallback;
  const cards: Card[] = [
    { id: "change", title: W.change.title, big: change > 0 ? W.change.up(change) : change < 0 ? W.change.down(-change) : W.change.flat },
    { id: "streak", title: W.streak.title, big: view.streak ? AURA.streak(view.streak) : "0", body: view.streak ? undefined : W.streak.none },
    { id: "on-time", title: W.onTime.title, big: String(onTime), body: W.onTime.body(onTime) },
    { id: "best", title: W.best.title, big: best },
    { id: "tip", title: W.tip.title, big: tip },
  ];
  // the share card carries tier and streak only; a paused account gets no tier slang, so no share card
  if (view.state !== "knockout") cards.push({ id: "share", title: W.share.title, big: view.tier.name, body: view.streak ? AURA.streak(view.streak) : undefined, share: true });
  return cards;
}

function ShareButton({ view }: { view: AuraView }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const text = W.share.text(view.tier.name, view.streak);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* the student closed the share sheet */
    }
  }
  return (
    <div className="mt-5 space-y-2">
      <GlassButton onClick={share}><Share2 className="size-4" aria-hidden /> {W.share.button}</GlassButton>
      <p role="status" className="text-xs opacity-80">{copied ? W.share.copied : W.share.body}</p>
    </div>
  );
}

export function Wrapped() {
  const { status, view } = useAura();
  const { history } = useAuraHistory(30);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);

  if (status === "loading") return <AuraSkeleton />;
  if (status === "no_score" || !view) return status === "unavailable" ? <UnavailableBanner updatedAt={null} /> : <NoScore />;

  const cards = cardsFor(view, history);
  const at = Math.min(i, cards.length - 1);
  const card = cards[at];
  const go = (d: number) => {
    const next = Math.max(0, Math.min(cards.length - 1, at + d));
    setDir(d);
    setI(next);
  };

  return (
    <div className="space-y-4" data-testid="aura-wrapped">
      {status === "unavailable" && <UnavailableBanner updatedAt={view.updatedAt} />}
      <p className="text-sm text-ink-2">{W.subtitle}</p>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={W.title}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        className="relative overflow-hidden rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
      >
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.section
            key={card.id}
            aria-roledescription="slide"
            aria-label={W.cardLabel(at + 1, cards.length)}
            custom={dir}
            initial={{ x: dir * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -60, opacity: 0 }}
            transition={{ duration: 0.24 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
            className={cn("flex min-h-[340px] flex-col justify-between p-7", card.share ? "bg-accent text-accent-ink" : "bg-pill text-pill-fg")}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{card.title}</p>
            <div>
              <p className="text-balance text-[clamp(2rem,6vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.04em]">{card.big}</p>
              {card.body && <p className="mt-2 text-sm opacity-80">{card.body}</p>}
              {card.share && <ShareButton view={view} />}
            </div>
            <p className="text-xs opacity-60">{at + 1} / {cards.length}</p>
          </motion.section>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between">
        <GlassButton variant="secondary" size="icon" aria-label={W.prev} disabled={at === 0} onClick={() => go(-1)}><ChevronLeft className="size-5" /></GlassButton>
        <div className="flex gap-1.5" aria-hidden>
          {cards.map((c, n) => <span key={c.id} className={cn("size-2 rounded-full", n === at ? "bg-ink" : "bg-ink/20")} />)}
        </div>
        <GlassButton variant="secondary" size="icon" aria-label={W.next} disabled={at === cards.length - 1} onClick={() => go(1)}><ChevronRight className="size-5" /></GlassButton>
      </div>
    </div>
  );
}
