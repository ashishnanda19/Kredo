"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { LogoMark } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { BRAND } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { EmailPill } from "./email-pill";

/**
 * F2 nav with two states. At the top it sits flat on the page (mark + wordmark, centred links,
 * plain text CTA). Over the first 80px of scroll it morphs into a floating frosted pill (mark only,
 * same links, solid pill button). Width, padding and background interpolate via a CSS variable
 * (--p, 0..1) written on scroll, so React never re-renders while scrolling.
 * Over any element marked data-nav-theme="dark" the pill inverts (dark glass, white button). Over a light-only
 * subtree (.theme-light, the hero opening) the nav takes the light tokens too, whatever the site theme.
 */
export function MorphNav() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const t = COPY.landing.nav;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / 80));
      el.style.setProperty("--p", p.toFixed(3));
      el.dataset.pill = p > 0.5 ? "true" : "false";
      const r = el.getBoundingClientRect();
      const stack = document.elementsFromPoint(window.innerWidth / 2, r.top + 30);
      const host = stack.find((n) => !el.contains(n))?.closest<HTMLElement>("[data-nav-theme]");
      const theme = host?.dataset.navTheme;
      el.dataset.tone = theme === "dark" ? "dark" : "light";
      el.classList.toggle("theme-light", theme !== "dark" && !!host?.closest(".theme-light"));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // the hero changes its own theme while pinned; re-check periodically while it animates
    const id = setInterval(update, 400);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      ref={ref}
      data-pill="false"
      data-tone="light"
      style={{ ["--p" as string]: 0 }}
      className="group pointer-events-none fixed inset-x-0 top-[var(--bar-h)] z-50 px-3 pt-[calc(var(--p)*10px)] print:hidden"
    >
      <nav
        aria-label="Main"
        className="pointer-events-auto relative mx-auto flex h-14 items-center justify-between gap-3 text-ink group-data-[tone=dark]:text-white"
        style={{ maxWidth: "calc(1180px - var(--p) * 470px)", paddingInline: "calc(6px + var(--p) * 6px)" }}
      >
        {/* pill background fades in with scroll; inverts on dark sections */}
        <span
          aria-hidden
          className="frost absolute inset-0 -z-10 rounded-full shadow-[0_8px_30px_-10px_rgba(0,0,0,0.18)] transition-colors duration-300 group-data-[tone=dark]:border-white/10 group-data-[tone=dark]:bg-[rgba(16,16,24,0.72)]"
          style={{ opacity: "var(--p)" }}
        />

        <Link href="/" aria-label={`${BRAND.name} home`} className="flex min-h-11 items-center gap-2">
          <span className="group-data-[tone=dark]:hidden"><LogoMark /></span>
          <span className="hidden group-data-[tone=dark]:inline"><LogoMark inverted /></span>
          <span
            className="overflow-hidden whitespace-nowrap text-[17px] font-semibold tracking-[-0.02em]"
            style={{ opacity: "calc(1 - var(--p) * 1.6)", maxWidth: "calc((1 - var(--p)) * 90px)" }}
          >
            {BRAND.name}
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {t.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="inline-flex min-h-11 items-center rounded-full px-3 text-[13px] font-medium text-ink/80 transition-colors hover:text-ink group-data-[tone=dark]:text-white/75 group-data-[tone=dark]:hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <span className="hidden sm:block"><ThemeToggle className="group-data-[tone=dark]:text-white group-data-[tone=dark]:hover:bg-white/10" /></span>
          {/* one CTA: plain text when flat, a solid pill when floating (background fades in with --p) */}
          <a
            href="#access"
            className="relative isolate hidden min-h-9 items-center gap-1 overflow-hidden rounded-full px-4 text-[13px] font-semibold transition-colors duration-200 group-data-[pill=true]:text-pill-fg group-data-[tone=dark]:group-data-[pill=true]:text-[#0b0b0c] md:inline-flex"
          >
            <span aria-hidden className="absolute inset-0 -z-10 rounded-full bg-pill group-data-[tone=dark]:bg-white" style={{ opacity: "var(--p)" }} />
            {t.access}
            <ArrowUpRight className="size-3.5 group-data-[pill=true]:hidden" aria-hidden />
          </a>
          <button type="button" onClick={() => setOpen(true)} aria-label={t.menu} aria-expanded={open} className="grid size-11 place-items-center rounded-full md:hidden">
            <Menu className="size-5" />
          </button>
        </div>
      </nav>

      <GlassSheet open={open} onOpenChange={setOpen}>
        <GlassSheetContent>
          <GlassSheetTitle className="text-lg font-semibold">{BRAND.name}</GlassSheetTitle>
          <GlassSheetDescription className="sr-only">Site navigation</GlassSheetDescription>
          <ul className="mt-3 space-y-1">
            {t.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-2xl px-3 text-base font-semibold hover:bg-card">
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/login" className="flex min-h-12 items-center rounded-2xl px-3 text-base font-semibold hover:bg-card">
                {t.login}
              </Link>
            </li>
          </ul>
          <EmailPill className="mt-4" compact />
          <div className="mt-3 flex justify-end"><ThemeToggle /></div>
        </GlassSheetContent>
      </GlassSheet>
    </header>
  );
}
