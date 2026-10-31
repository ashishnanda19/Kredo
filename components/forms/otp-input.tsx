"use client";

import { useRef } from "react";

interface OtpInputProps {
  digits: string[];
  onChange: (d: string[]) => void;
  invalid?: boolean;
  label?: string;
  autoFocus?: boolean;
}

/** 6 separate boxes: auto-advance, backspace, arrow keys, paste and one-time-code autofill. */
export function OtpInput({ digits, onChange, invalid, label = "6-digit code" }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const len = digits.length;

  function set(i: number, raw: string) {
    const v = raw.replace(/\D/g, "");
    if (!v) {
      onChange(digits.map((x, idx) => (idx === i ? "" : x)));
      return;
    }
    const next = [...digits];
    v.slice(0, len - i)
      .split("")
      .forEach((ch, k) => (next[i + k] = ch));
    onChange(next);
    refs.current[Math.min(i + v.length, len - 1)]?.focus();
  }

  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="grid grid-cols-6 gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1} of ${len}`}
            aria-invalid={invalid || undefined}
            maxLength={len}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "ArrowRight" && i < len - 1) refs.current[i + 1]?.focus();
            }}
            onFocus={(e) => e.target.select()}
            className="h-14 w-full min-w-0 rounded-2xl border border-foreground/20 bg-foreground/[0.07] text-center text-2xl font-bold tabular-nums backdrop-blur-xl transition-[border-color,box-shadow] focus-visible:border-neon-violet focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--neon-violet)_30%,transparent),0_0_24px_-4px_var(--glow)] focus-visible:outline-none aria-[invalid=true]:border-danger"
          />
        ))}
      </div>
    </fieldset>
  );
}
