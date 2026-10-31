"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, FlaskConical, X } from "lucide-react";
import { COPY } from "@/lib/copy";

const KEY = "kredo-bar";
const subs = new Set<() => void>();
const isClosed = () => document.documentElement.dataset.bar === "closed";

function close() {
  document.documentElement.dataset.bar = "closed";
  try {
    sessionStorage.setItem(KEY, "closed");
  } catch {
    /* ignore */
  }
  subs.forEach((s) => s());
}

/**
 * F1 announcement bar: full-width indigo bar with an icon, short text, a link and a close X.
 * It doubles as the always-visible demo tag. If dismissed, a small "Demo" chip stays on screen,
 * so the demo notice is never hidden.
 */
export function AnnouncementBar() {
  const closed = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    isClosed,
    () => false,
  );
  const t = COPY.landing.bar;

  if (closed)
    return (
      <p role="note" className="fixed bottom-3 left-3 z-[80] inline-flex items-center gap-1.5 rounded-full bg-[#2a1ba1] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg print:hidden">
        <FlaskConical className="size-3.5" aria-hidden /> {t.chip}
      </p>
    );

  return (
    <div role="note" className="fixed inset-x-0 top-0 z-[80] flex h-[var(--bar-h)] items-center justify-center bg-[#2a1ba1] px-10 text-[12px] font-medium text-white print:hidden">
      <p className="flex min-w-0 items-center gap-2">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{t.text}</span>
        <span aria-hidden className="hidden sm:inline">·</span>
        <Link href="/#access" className="hidden shrink-0 items-center gap-1 font-semibold underline-offset-4 hover:underline sm:inline-flex">
          {t.link} <ArrowRight className="size-3" aria-hidden />
        </Link>
      </p>
      <button type="button" onClick={close} aria-label={t.close} className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-white/85 hover:text-white">
        <X className="size-4" />
      </button>
    </div>
  );
}
