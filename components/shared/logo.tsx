import Link from "next/link";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Logo mark: a rounded ink square with a simple "K" built from two strokes. Inverts in dark contexts. */
export function LogoMark({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className={inverted ? "fill-white" : "fill-ink"} />
      <g className={inverted ? "stroke-[#0b0b0c]" : "stroke-page"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M11 8.5v15" />
        <path d="M21 9 13.5 16l7.7 7.5" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", className, wordmark = true }: { href?: string; className?: string; wordmark?: boolean }) {
  return (
    <Link href={href} aria-label={`${BRAND.name} home`} className={cn("inline-flex min-h-11 items-center gap-2", className)}>
      <LogoMark />
      {wordmark && <span className="text-[17px] font-semibold tracking-[-0.02em]">{BRAND.name}</span>}
    </Link>
  );
}
