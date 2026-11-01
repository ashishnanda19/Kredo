"use client";

import { Coffee, Printer, Shirt, UtensilsCrossed, PenLine, type LucideIcon } from "lucide-react";
import { GlassButton, GlassSheet, GlassSheetContent, GlassSheetTrigger } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { vendors, type Category, type Vendor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { PartnerForm } from "./partner-form";
import { TwoTone } from "./two-tone";

const ICON: Record<Category, LucideIcon> = { canteen: UtensilsCrossed, cafe: Coffee, stationery: PenLine, photocopy: Printer, laundry: Shirt };

/** The sample clock for open/closed: 7:30 pm. */
const SAMPLE_MINUTES = 19 * 60 + 30;
const toMin = (s: string) => {
  const m = s.trim().match(/^(\d{1,2})(am|pm)$/);
  if (!m) return 0;
  return ((+m[1] % 12) + (m[2] === "pm" ? 12 : 0)) * 60;
};
const isOpen = (v: Vendor) => {
  const [a, b] = v.hours.split(" to ").map(toMin);
  return SAMPLE_MINUTES >= a && SAMPLE_MINUTES < b;
};

function Chip({ v }: { v: Vendor }) {
  const t = COPY.landing.vendors;
  const Icon = ICON[v.category];
  const open = isOpen(v);
  return (
    <li className="flex shrink-0 items-center gap-3 rounded-full bg-elevated py-2 pl-2 pr-5 ring-1 ring-hairline">
      <span className="grid size-10 place-items-center rounded-full bg-soft">
        <Icon className="size-[18px] text-ink" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-[14.5px] font-semibold text-ink">{v.name}</span>
        <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
          <span className={cn("size-1.5 rounded-full", open ? "bg-ok" : "bg-ink-3")} aria-hidden />
          <span className={open ? "font-semibold text-ok-text" : ""}>{open ? t.open : t.closed}</span>· {v.distance}
        </span>
      </span>
    </li>
  );
}

function Row({ items, reverse }: { items: Vendor[]; reverse?: boolean }) {
  // two copies back to back; the track slides by exactly one copy (-50%) and loops
  return (
    <div className="edge-fade-x group overflow-hidden py-1.5">
      <ul
        className={cn("flex w-max gap-3 pr-3 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none", reverse && "[animation-direction:reverse]")}
        style={{ animationDuration: "48s" }}
      >
        {[...items, ...items].map((v, i) => (
          <Chip key={`${v.id}-${i}`} v={v} />
        ))}
      </ul>
    </div>
  );
}

/** R-section vendor marquee (#vendors): two rows of vendor chips sliding opposite ways, with a partner CTA. */
export function VendorMarquee() {
  const t = COPY.landing.vendors;
  const half = Math.ceil(vendors.length / 2);
  const a = vendors.slice(0, half);
  const b = vendors.slice(half);
  return (
    <section id="vendors" aria-labelledby="vendors-title" className="scroll-mt-24 bg-soft-seam py-32 sm:py-40">
      <div data-reveal className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <TwoTone id="vendors-title" a={t.titleA} b={t.titleB} className="max-w-2xl" />
        <GlassSheet>
          <GlassSheetTrigger asChild>
            <GlassButton>{t.cta}</GlassButton>
          </GlassSheetTrigger>
          <GlassSheetContent>
            <PartnerForm />
          </GlassSheetContent>
        </GlassSheet>
      </div>
      {/* the full list for assistive tech; the moving rows are decorative duplicates */}
      <ul className="sr-only">
        {vendors.map((v) => (
          <li key={v.id}>{`${v.name}, ${v.distance}, ${isOpen(v) ? t.open : t.closed}`}</li>
        ))}
      </ul>
      <div data-reveal aria-hidden className="mt-12 space-y-2">
        <Row items={[...a, ...a]} />
        <Row items={[...b, ...b]} reverse />
      </div>
      <p className="mx-auto mt-6 max-w-[1180px] px-4 text-[12px] text-ink-2 sm:px-6">{t.sampleTime}</p>
    </section>
  );
}
