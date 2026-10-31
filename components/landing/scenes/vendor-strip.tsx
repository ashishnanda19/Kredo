"use client";

import { useRef } from "react";
import { BadgeCheck, MapPin } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { CategoryIcon } from "@/components/shared/category-icon";
import { BRAND } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap } from "@/lib/scroll";
import { CATEGORY_LABEL, vendors } from "@/lib/mock-data";
import { SectionHeading } from "../section-heading";
import { useGsapScene } from "./use-gsap-scene";

function VendorCard({ v }: { v: (typeof vendors)[number] }) {
  return (
    <GlassCard radius="xl" strength="strong" className="flex h-[min(56svh,360px)] w-[min(72vw,290px)] shrink-0 flex-col justify-between p-6">
      <div className="flex items-start justify-between gap-2">
        <CategoryIcon category={v.category} className="size-14 rounded-3xl [&_svg]:size-7" />
        <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
          <BadgeCheck className="size-3.5" aria-hidden /> {COPY.dashboard.vendors.badge} {BRAND.name}
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-extrabold tracking-tight">{v.name}</h3>
        <p className="mt-1 text-muted">{CATEGORY_LABEL[v.category]}</p>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-4" aria-hidden /> {v.distance} · {v.hours}
        </p>
      </div>
    </GlassCard>
  );
}

/**
 * Pinned horizontal strip of vendor cards: vertical scroll drives the track sideways.
 * Reduced motion: a normal horizontally scrollable row (no pin, no scrub).
 */
export function VendorStrip() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();

  useGsapScene(root, (el) => {
    const t = track.current;
    if (!t) return;
    const distance = () => Math.max(0, t.scrollWidth - window.innerWidth);
    gsap.to(t, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: { trigger: el, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
    });
  });

  return (
    <section id="vendor-strip" ref={root} aria-label={COPY.vendors.stripTitle} className={reduce ? "py-16" : "relative h-svh overflow-hidden"}>
      <div
        ref={track}
        className={
          reduce
            ? "scrollbar-none flex snap-x gap-5 overflow-x-auto px-4 sm:px-6"
            : "flex h-full w-max items-center gap-5 pl-[max(1rem,calc((100vw-72rem)/2+1.5rem))] pr-[20vw]"
        }
      >
        <div className="w-[min(82vw,440px)] shrink-0">
          <SectionHeading eyebrow={COPY.vendors.stripTitle} lines={["Your campus,", "already on it."]} accent={1} className="[&_h2]:text-4xl sm:[&_h2]:text-5xl" />
          <p className="mt-4 max-w-sm text-white/85 [html:not(.dark)_&]:text-foreground/80">Keep scrolling. The strip moves sideways.</p>
        </div>
        {vendors.map((v) => (
          <VendorCard key={v.id} v={v} />
        ))}
      </div>
    </section>
  );
}
