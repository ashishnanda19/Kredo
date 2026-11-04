import { Lock } from "lucide-react";
import { LogoLockup } from "@/components/shared/logo";

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
 * The two faces of the card as DOM (flat graphite, one hairline highlight). Shared by the inline
 * CSS card (poster / low-power fallback) and the scroll-driven fixed card.
 * Parent must provide `transform-style: preserve-3d`.
 */
export function CardFaces({ name, number, back, frontExtra, frontHidden, backHidden }: CardFacesProps) {
  return (
    <>
      <div
        aria-hidden={frontHidden}
        inert={frontHidden}
        className="backface-hidden absolute inset-0 overflow-hidden rounded-[7%/11%] bg-[#0b0b0c] text-white shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)]"
      >
        {/* brand yellow panel on the right, like the landing card, and a soft graphite sheen across the black */}
        <span aria-hidden className="absolute inset-y-0 right-0 w-[28%] bg-accent" />
        <span aria-hidden className="absolute inset-y-0 left-0 w-[72%] bg-[linear-gradient(105deg,transparent_38%,rgba(255,255,255,0.09)_50%,transparent_62%)]" />
        <div className="relative flex h-full flex-col justify-between p-[5%]">
          <div className="flex items-start justify-between">
            <LogoLockup className="h-7 text-white" />
          </div>
          <div>
            <span aria-hidden className="mb-4 block h-[26px] w-[38px] rounded-[7px] bg-accent" />
            <div className="flex items-center gap-3 font-mono text-[13px] uppercase tracking-[0.28em] text-white/60 sm:text-sm">
              <span>Student</span>
              <span aria-hidden className="tracking-[0.35em]">••••</span>
              <span className="text-white" aria-label={`Card number ${number}`}>{number.replace(/[^0-9]/g, "").slice(-4)}</span>
            </div>
            <div className="mt-3 flex flex-col items-start gap-1.5 min-[400px]:flex-row min-[400px]:items-end min-[400px]:justify-between">
              <p className="truncate text-sm font-semibold uppercase tracking-wider">{name}</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0b0b0c]/90 px-2.5 py-1 text-[11px] font-semibold text-white">
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
        className="backface-hidden absolute inset-0 overflow-hidden rounded-[7%/11%] bg-[#111114] text-white ring-1 ring-inset ring-white/10 [transform:rotateY(180deg)]"
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
