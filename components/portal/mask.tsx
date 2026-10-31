"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Identifiers are always shown masked. There is deliberately no "reveal" control. */
export function MaskedValue({ value, label }: { value: string; label?: string }) {
  return (
    <span className="font-mono tracking-wider" aria-label={label ? `${label}, masked` : "Masked value"}>
      {value}
    </span>
  );
}

/** Reference number with a copy button. */
export function ReferenceNumber({ value, label = "Reference" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-foreground/[0.08] py-1 pl-3 pr-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-mono font-bold">{value}</span>
      <button
        type="button"
        aria-label={`Copy ${label.toLowerCase()} ${value}`}
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="grid size-8 place-items-center rounded-full hover:bg-foreground/10"
      >
        {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </button>
    </span>
  );
}
