"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { COPY } from "@/lib/copy";
import { validateCollegeEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";

/**
 * R3 email capture pill: grey input with the accent button inside it, consent line below.
 * Client-side only. Nothing is sent anywhere.
 */
export function EmailPill({ className, dark, compact }: { className?: string; dark?: boolean; compact?: boolean }) {
  const t = COPY.landing.access;
  const id = useId();
  const [v, setV] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = validateCollegeEmail(v);
    setErr(m);
    if (m) return;
    setState("busy");
    setTimeout(() => setState("done"), 700);
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {state === "done" ? (
          <motion.p key="done" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold", dark ? "bg-white/10 text-white" : "bg-card text-ink")}>
            <span className="grid size-6 place-items-center rounded-full bg-accent text-accent-ink"><Check className="size-3.5" aria-hidden /></span>
            {t.done} <span className={dark ? "font-normal text-white/60" : "font-normal text-ink-2"}>{t.doneSub}</span>
          </motion.p>
        ) : (
          <motion.form key="form" exit={{ opacity: 0 }} onSubmit={submit} noValidate className={cn("flex items-center gap-1 rounded-full p-1 pl-4", dark ? "bg-white/10" : "bg-card", err && "ring-2 ring-bad")}>
            <label htmlFor={id} className="sr-only">{t.placeholder}</label>
            <input
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t.placeholder}
              value={v}
              onChange={(e) => { setV(e.target.value); setErr(null); }}
              aria-invalid={!!err || undefined}
              aria-describedby={`${id}-msg`}
              className={cn("min-h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none", dark ? "text-white placeholder:text-white/50" : "text-ink placeholder:text-ink-2")}
            />
            <button type="submit" disabled={state === "busy"} className="sweep relative inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition-transform active:scale-[0.97]">
              {state === "busy" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {compact ? "Join" : t.button}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      <p id={`${id}-msg`} role={err ? "alert" : undefined} className={cn("mt-2 px-1 text-xs", err ? "font-medium text-bad-text" : dark ? "text-white/55" : "text-ink-2")}>
        {err ?? t.consent}
      </p>
    </div>
  );
}
