"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Sparkles } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { formatINR } from "@/lib/format";
import { student } from "@/lib/mock-data";
import { gsap } from "@/lib/scroll";
import { useGsapScene } from "../scenes/use-gsap-scene";
import { TwoTone } from "./two-tone";

function Callout({ tone, children, className, ...rest }: { tone: "ok" | "warn" | "ink"; children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  const cls = tone === "ok" ? "bg-[#e9f8ef] text-ok-text ring-ok/30" : tone === "warn" ? "bg-[#fff4e0] text-warn-text ring-warn/40" : "bg-pill text-pill-fg ring-transparent";
  const Icon = tone === "ok" ? Check : tone === "warn" ? CircleAlert : Sparkles;
  return (
    <span className={`absolute inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-wide shadow-sm ring-1 ${cls} ${className ?? ""}`} {...rest}>
      <Icon className="size-3.5" strokeWidth={2.6} aria-hidden />
      {children}
    </span>
  );
}

/**
 * R-section "Verify in minutes": two-tone heading and a panel where a scripted cursor boxes a sample college ID,
 * the checks resolve one by one and the limit is set. The markup is the finished state; GSAP plays it in once
 * when the panel scrolls into view (skipped under reduced motion, which simply shows the finished state).
 */
export function VerifyPanel() {
  const t = COPY.landing.verifyPanel;
  const ref = useRef<HTMLElement>(null);

  useGsapScene(ref, (root) => {
    const q = (s: string) => root.querySelector(s);
    const tl = gsap.timeline({ scrollTrigger: { trigger: q("[data-panel]"), start: "top 70%", once: true }, defaults: { ease: "power3.out" } });
    tl.from(q("[data-cursor]"), { xPercent: 260, yPercent: 320, opacity: 0, duration: 0.9 })
      .to(q("[data-cursor]"), { x: -6, y: 4, duration: 0.12, yoyo: true, repeat: 1 }) // click
      .from(q("[data-box]"), { scale: 0.92, opacity: 0, duration: 0.45 }, "<")
      .from(q("[data-box-label]"), { y: 6, opacity: 0, duration: 0.3 }, "<0.15")
      .from(q("[data-c1]"), { scale: 0.6, opacity: 0, duration: 0.35, ease: "back.out(2)" }, "+=0.25")
      .from(q("[data-c2]"), { scale: 0.6, opacity: 0, duration: 0.35, ease: "back.out(2)" }, "+=0.2")
      .fromTo(q("[data-review]"), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, "+=0.2")
      .to(q("[data-review]"), { opacity: 0, y: -6, duration: 0.3 }, "+=0.7")
      .from(q("[data-c3]"), { scale: 0.6, opacity: 0, duration: 0.35, ease: "back.out(2)" }, "<0.1")
      .to(q("[data-cursor]"), { xPercent: 40, yPercent: 180, duration: 0.7, ease: "power2.inOut" }, "+=0.2")
      .from(q("[data-limit]"), { y: 16, opacity: 0, duration: 0.5 }, "<0.3");
  });

  return (
    <section ref={ref} aria-labelledby="verify-panel-title" className="bg-page py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <TwoTone id="verify-panel-title" a={t.titleA} b={t.titleB} />
          <p className="mt-5 max-w-md text-pretty text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">{t.sub}</p>
          <GlassButton asChild className="mt-7">
            <Link href="/verify">
              {t.cta} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </GlassButton>
        </div>

        <div data-panel aria-hidden className="relative overflow-hidden rounded-[20px] bg-soft p-5 ring-1 ring-hairline sm:p-8">
          <div className="dot-grid absolute inset-0 opacity-60" />
          {/* sample college ID */}
          <div className="relative mx-auto mt-6 w-full max-w-[420px]">
            <div data-box className="absolute -inset-3 rounded-[18px] border-2 border-dashed border-info" />
            <span data-box-label className="absolute -top-9 left-0 rounded-md bg-info px-2 py-0.5 font-mono text-[10.5px] font-semibold tracking-wide text-white">
              {t.callouts.box}
            </span>
            <div className="relative aspect-[1.586/1] overflow-hidden rounded-[14px] bg-elevated shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)] ring-1 ring-hairline">
              <div className="flex h-[22%] items-center gap-2 bg-[#1f3b8a] px-4 text-white">
                <span className="grid size-6 place-items-center rounded-full bg-white/20 text-[10px] font-bold">SIT</span>
                <span className="truncate text-[12px] font-semibold sm:text-[13px]">{student.college}</span>
              </div>
              <div className="flex gap-4 p-4">
                <div className="grid aspect-[3/4] w-[26%] shrink-0 place-items-end overflow-hidden rounded-[8px] bg-[#e4e7f0]">
                  <svg viewBox="0 0 60 80" className="w-full fill-[#b7bdd1]"><circle cx="30" cy="30" r="14" /><path d="M6 80c2-20 12-28 24-28s22 8 24 28Z" /></svg>
                </div>
                <dl className="min-w-0 flex-1 space-y-1.5 text-[11px] sm:text-[12px]">
                  <div><dt className="text-ink-2">Name</dt><dd className="font-semibold text-ink">{student.name}</dd></div>
                  <div><dt className="text-ink-2">Course</dt><dd className="font-semibold text-ink">B.Tech, 2nd year</dd></div>
                  <div><dt className="text-ink-2">Valid till</dt><dd className="font-semibold text-ink">Jun 2028</dd></div>
                </dl>
              </div>
              <span className="absolute bottom-2 right-3 text-[9px] font-semibold uppercase tracking-wider text-ink-3">Sample ID</span>
            </div>
            <Callout data-c1 tone="ok" className="-right-2 top-[30%] sm:-right-10">{t.callouts.matched}</Callout>
            <Callout data-c2 tone="ok" className="-right-2 top-[48%] sm:-right-6">MATCHED · Name</Callout>
            <Callout data-review tone="warn" className="-right-2 top-[66%] opacity-0 sm:-right-8">{t.callouts.review}</Callout>
            <Callout data-c3 tone="ok" className="-right-2 top-[66%] sm:-right-8">MATCHED · Validity</Callout>
          </div>
          <div data-limit className="relative mx-auto mt-10 flex w-full max-w-[420px] items-center justify-between rounded-[14px] bg-elevated px-4 py-3 ring-1 ring-hairline">
            <span className="font-mono text-[11px] font-semibold tracking-wide text-ink-2">{t.callouts.limit}</span>
            <span className="text-[18px] font-semibold tracking-[-0.02em] text-ink">{formatINR(student.limit)}</span>
          </div>
          {/* scripted cursor */}
          <svg data-cursor viewBox="0 0 24 24" className="absolute left-[46%] top-[40%] size-7 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
            <path d="M4 2.5 19.5 12l-6.8 1.6L9.8 20Z" fill="#0b0b0c" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
