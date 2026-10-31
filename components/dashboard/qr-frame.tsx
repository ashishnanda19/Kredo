"use client";

import { Camera, CheckCircle2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface QrFrameProps {
  scanning: boolean;
  scanned?: string | null;
  onScan: () => void;
}

const corner = "absolute size-8 border-neon-blue";

/** Mock QR scanner. No camera is used: tap to simulate a scan. */
export function QrFrame({ scanning, scanned, onScan }: QrFrameProps) {
  return (
    <button
      type="button"
      onClick={onScan}
      disabled={scanning}
      aria-label={scanned ? `Scanned ${scanned}. Tap to scan again` : "Tap to simulate scanning a vendor QR code"}
      className="group relative mx-auto grid aspect-square w-full max-w-[280px] place-items-center overflow-hidden rounded-hero bg-black/90 text-white"
    >
      {/* faux camera view */}
      <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.35),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(67,56,202,0.35),transparent_50%)]" />
      <span aria-hidden className={cn(corner, "left-5 top-5 rounded-tl-2xl border-l-4 border-t-4")} />
      <span aria-hidden className={cn(corner, "right-5 top-5 rounded-tr-2xl border-r-4 border-t-4")} />
      <span aria-hidden className={cn(corner, "bottom-5 left-5 rounded-bl-2xl border-b-4 border-l-4")} />
      <span aria-hidden className={cn(corner, "bottom-5 right-5 rounded-br-2xl border-b-4 border-r-4")} />

      {/* sample QR pattern */}
      <span aria-hidden className="relative grid size-32 grid-cols-7 gap-[3px] opacity-70">
        {Array.from({ length: 49 }).map((_, i) => (
          <span key={i} className={cn("rounded-[2px]", [0, 1, 2, 4, 5, 6, 7, 9, 11, 13, 14, 16, 18, 20, 21, 22, 24, 26, 28, 30, 32, 33, 35, 36, 38, 40, 42, 43, 44, 46, 48].includes(i) ? "bg-white" : "bg-white/10")} />
        ))}
      </span>

      {scanning && <span aria-hidden className="absolute inset-x-6 h-0.5 animate-scan rounded-full bg-neon-blue shadow-[0_0_18px_6px_rgba(56,189,248,0.6)] motion-reduce:hidden" />}

      <span className="absolute inset-x-0 bottom-3 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur">
          {scanning ? (
            <>
              <ScanLine className="size-3.5" aria-hidden /> Scanning…
            </>
          ) : scanned ? (
            <>
              <CheckCircle2 className="size-3.5 text-success" aria-hidden /> {scanned}
            </>
          ) : (
            <>
              <Camera className="size-3.5" aria-hidden /> Tap to scan vendor QR
            </>
          )}
        </span>
      </span>
    </button>
  );
}
