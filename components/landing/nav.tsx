"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { GlassButton, GlassNav } from "@/components/glass";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { COPY } from "@/lib/copy";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <GlassNav className={open ? "!rounded-[28px]" : undefined}>
      <nav aria-label="Main">
        <div className="flex h-14 items-center justify-between gap-2 pl-4 pr-2 sm:pl-5">
          <Logo />

          <ul className="hidden items-center gap-0.5 lg:flex">
            {COPY.nav.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:text-foreground">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <GlassButton asChild size="sm" className="hidden sm:inline-flex">
              <a href="#signup">{COPY.nav.cta}</a>
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </GlassButton>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="overflow-hidden lg:hidden"
            >
              <ul className="flex flex-col gap-1 px-3 pb-4 pt-1">
                {COPY.nav.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-2xl px-4 text-base font-semibold hover:bg-foreground/10">
                      {l.label}
                    </a>
                  </li>
                ))}
                <li className="pt-2">
                  <GlassButton asChild className="w-full">
                    <a href="#signup" onClick={() => setOpen(false)}>
                      {COPY.nav.cta}
                    </a>
                  </GlassButton>
                </li>
                <li>
                  <GlassButton asChild variant="outline" className="mt-2 w-full">
                    <Link href="/dashboard">{COPY.nav.demo}</Link>
                  </GlassButton>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </GlassNav>
  );
}
