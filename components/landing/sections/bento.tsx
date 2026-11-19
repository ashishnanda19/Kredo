import { ArrowRight, Bell, Check, Coffee, Lock, Printer, UtensilsCrossed } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { LogoMark } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";
import { BRAND } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import { GridField, GridRule } from "./grid-field";
import { TwoTone } from "./two-tone";

function Card({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  const c = COPY.landing.bento.cards[i];
  return (
    // the outer block is moved by the reveal; the card inside it is the one that leans to the pointer (see depth-fx.tsx)
    <Reveal delay={i * 0.05} className={cn("flex min-h-[240px] flex-col md:min-h-[340px]", className)}>
      <div data-tilt data-spotlight className="spotlight glow-ring group relative flex flex-1 flex-col overflow-hidden rounded-[16px] bg-card p-6">
        <h3 className="max-w-xs text-[19px] font-semibold leading-snug tracking-[-0.02em]">
          <span className="text-ink">{c.a}</span> <span className="text-ink-2">{c.b}</span>
        </h3>
        <div aria-hidden data-lift className="relative mt-6 flex flex-1 items-end">
          {children}
        </div>
      </div>
    </Reveal>
  );
}

const ROWS = [
  { icon: Coffee, name: "Campus Cafe", amt: "₹120" },
  { icon: Printer, name: "Xerox Corner", amt: "₹40" },
  { icon: UtensilsCrossed, name: "Annapurna Canteen", amt: "₹85" },
];

/** Ramp-style bento: two-tone heading with a pair of CTAs, then five cards with small, static product visuals. */
export function Bento() {
  const t = COPY.landing.bento;
  return (
    <section aria-labelledby="bento-title" className="relative isolate bg-page py-24 sm:py-32">
      <GridRule />
      <GridField seed={3} className="h-[640px] [mask-image:radial-gradient(75%_80%_at_70%_8%,#000,transparent)]" />
      <div data-reveal className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <TwoTone id="bento-title" a={t.titleA} b={t.titleB} className="max-w-2xl" />
          <div className="flex flex-wrap gap-3">
            <span data-magnetic className="inline-flex">
              <GlassButton asChild variant="accent">
                <a href="#access">{t.primary}</a>
              </GlassButton>
            </span>
            <span data-magnetic className="inline-flex">
              <GlassButton asChild variant="secondary">
                <a href="#how">
                  {t.secondary} <ArrowRight className="size-4" aria-hidden />
                </a>
              </GlassButton>
            </span>
          </div>
        </div>

        <div data-stagger className="mt-12 grid gap-3 md:grid-cols-6">
          {/* 1: pay at campus, receipts that file themselves */}
          <Card i={0} className="md:col-span-4 [--tilt:0.6]">
            <div className="relative w-full pt-24 md:pt-0">
              <ul className="max-w-[400px] space-y-2 lg:max-w-[420px]">
                {ROWS.map((r) => (
                  <li key={r.name} className="flex items-center gap-3 rounded-[12px] bg-elevated px-3 py-2.5 ring-1 ring-hairline">
                    <span className="grid size-8 place-items-center rounded-[9px] bg-soft"><r.icon className="size-4 text-ink" /></span>
                    <span className="flex-1 text-[14px] font-medium text-ink">{r.name}</span>
                    <span className="text-[14px] font-semibold text-ink">{r.amt}</span>
                    <Check className="size-4 text-ok" strokeWidth={3} />
                  </li>
                ))}
              </ul>
              <div className="absolute right-0 top-0 w-[min(290px,100%)] md:-top-12 rounded-[16px] bg-elevated/95 p-3 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.35)] ring-1 ring-hairline backdrop-blur transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1.5 md:max-lg:w-[240px]">
                <p className="flex items-center gap-2 text-[11px] font-semibold text-ink-2">
                  <LogoMark className="size-5" />
                  {BRAND.name} · now
                </p>
                <p className="mt-1.5 text-[13px] font-semibold leading-snug text-ink">{t.toast.title}</p>
                <p className="text-[12px] text-ink-2">{t.toast.body}</p>
              </div>
            </div>
          </Card>

          {/* 2: repay without stress */}
          <Card i={1} className="md:col-span-2">
            <div className="w-full rounded-[14px] bg-elevated p-4 ring-1 ring-hairline">
              <p className="text-[12px] text-ink-2">Next due · 2 Nov</p>
              <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink"><CountUp to={1150} prefix="₹" /></p>
              <span className="mt-2 inline-block rounded-[6px] bg-accent px-2 py-0.5 text-[12px] font-bold text-accent-ink">Due in 3 days</span>
              <div className="mt-4 grid h-10 place-items-center rounded-full bg-pill text-[14px] font-semibold text-pill-fg">Repay</div>
            </div>
          </Card>

          {/* 3: score, and what moves it */}
          <Card i={2} className="md:col-span-2">
            <div className="flex w-full items-center gap-4">
              <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="9" className="stroke-hairline" />
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-ink" strokeDasharray={`${0.72 * 264} 264`} />
              </svg>
              <div>
                <p className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink"><CountUp to={72} /></p>
                <p className="mt-1 text-[13px] font-semibold text-ink">Building</p>
                <p className="mt-1 text-[11.5px] leading-snug text-ink-2">Internal score, not a bureau score. Sample.</p>
              </div>
            </div>
          </Card>

          {/* 4: a limit that can grow */}
          <Card i={3} className="md:col-span-2">
            <div className="flex w-full items-end gap-2">
              {[["Aug", 1000, 34], ["Sep", 3000, 62], ["Oct", 5000, 100]].map(([m, v, h], k) => (
                <div key={m as string} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[12px] font-semibold text-ink">₹{(v as number).toLocaleString("en-IN")}</span>
                  <span className={cn("w-full rounded-t-[8px] rounded-b-[4px]", k === 2 ? "bg-accent" : "bg-ink/80")} style={{ height: `${(h as number) * 1.1}px` }} />
                  <span className="text-[11px] text-ink-2">{m}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 5: privacy and consent */}
          <Card i={4} className="md:col-span-2">
            <ul className="w-full divide-y divide-hairline rounded-[14px] bg-elevated px-4 ring-1 ring-hairline">
              {[
                [Bell, "Due-date reminders", true],
                [Lock, "ID photos stay on device", true],
                [Bell, "Marketing messages", false],
              ].map(([Icon, label, on]) => {
                const I = Icon as typeof Bell;
                return (
                  <li key={label as string} className="flex items-center gap-3 py-3 text-[13.5px] text-ink">
                    <I className="size-4 text-ink-2" />
                    <span className="flex-1">{label as string}</span>
                    <span className={cn("relative h-6 w-10 rounded-full transition-colors", on ? "bg-ok" : "bg-hairline")}>
                      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow", on ? "left-[18px]" : "left-0.5")} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}
