import { Lock, Wifi } from "lucide-react";
import { LogoMark } from "@/components/shared/logo";
import { BRAND } from "@/lib/config";

interface CardFacesProps {
  name: string;
  number: string;
  /** replaces the default back-face content */
  back?: React.ReactNode;
  /** extra overlay rendered on the front (e.g. the verified badge) */
  frontExtra?: React.ReactNode;
  frontHidden?: boolean;
  backHidden?: boolean;
}

/**
 * The two faces of the card as DOM (violet-to-magenta iridescent glass). Shared by the inline
 * CSS card (poster / low-power fallback) and the scroll-driven fixed card.
 * Parent must provide `transform-style: preserve-3d`.
 */
export function CardFaces({ name, number, back, frontExtra, frontHidden, backHidden }: CardFacesProps) {
  return (
    <>
      <div
        aria-hidden={frontHidden}
        inert={frontHidden}
        className="backface-hidden absolute inset-0 overflow-hidden rounded-[7%/11%] border border-white/10 bg-[linear-gradient(135deg,#1c1c22_0%,#0b0b0c_100%)] p-[5%] text-white"
      >
        <span aria-hidden className="absolute -right-10 -top-14 size-56 rounded-full bg-white/15 blur-sm" />
        <span aria-hidden className="absolute -right-12 -top-16 size-56 rounded-full bg-[radial-gradient(closest-side,rgba(245,216,50,0.22),transparent)]" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.22)_45%,transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <LogoMark className="size-7" />
              <span className="text-lg font-extrabold tracking-tight">{BRAND.name}</span>
            </div>
            <Wifi aria-hidden className="size-6 rotate-90 text-white/85" />
          </div>
          <div>
            <span aria-hidden className="mb-3 block h-7 w-10 rounded-md bg-[linear-gradient(135deg,#f8e57a,#e8c21e)] opacity-90" />
            <p className="font-mono text-base tracking-[0.14em] sm:text-lg" aria-label={`Card number ${number}`}>
              {number}
            </p>
            <div className="mt-2 flex flex-col items-start gap-1.5 min-[400px]:flex-row min-[400px]:items-end min-[400px]:justify-between">
              <p className="truncate text-sm font-semibold uppercase tracking-wider">{name}</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                <Lock className="size-3" aria-hidden /> Only works inside this app
              </span>
            </div>
          </div>
        </div>
        {frontExtra}
      </div>

      <div
        aria-hidden={backHidden}
        inert={backHidden}
        className="backface-hidden absolute inset-0 overflow-hidden rounded-[7%/11%] border border-white/20 bg-[linear-gradient(135deg,#1c1c22,#0b0b0c)] text-white [transform:rotateY(180deg)]"
      >
        {back ?? (
          <>
            <div aria-hidden className="mt-[7%] h-[18%] bg-black/80" />
            <div className="px-[5%] pt-[4%]">
              <p className="text-sm font-semibold text-white/90">Works only inside this app</p>
              <div aria-hidden className="mt-3 h-8 rounded-md bg-[repeating-linear-gradient(90deg,#e7e7ea_0_6px,#c9c9cf_6px_12px)] opacity-70" />
            </div>
          </>
        )}
      </div>
    </>
  );
}
