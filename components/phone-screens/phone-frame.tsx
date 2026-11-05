import { cn } from "@/lib/utils";
import { ScaledScreen } from "./parts";

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
  screenBg?: string;
  /** visually hide the frame's island (when a photographic hand-phone supplies its own) */
  island?: boolean;
  /** drop the soft floating shadow (for a phone lying flat on a surface, where the caller draws a tight contact shadow) */
  flat?: boolean;
  /** stretch the screen to the full glass height, so a screen that ends a few pixels short shows no empty strip at the bottom */
  fill?: boolean;
}

/**
 * Generic SVG/CSS phone: bezel, dynamic island and side buttons (no brand device).
 * Outer aspect 1:2.14 so the 390x844 screen fits the inner rectangle with no crop.
 */
export function PhoneFrame({ children, className, screenBg = "#fff", island = true, flat = false, fill = false }: PhoneFrameProps) {
  return (
    <div className={cn("relative aspect-[1/2.14]", className)}>
      <span aria-hidden className="absolute -left-[1.6%] top-[17%] h-[5%] w-[1.6%] rounded-l-sm bg-[#1b1b20]" />
      <span aria-hidden className="absolute -left-[1.6%] top-[24%] h-[8%] w-[1.6%] rounded-l-sm bg-[#1b1b20]" />
      <span aria-hidden className="absolute -right-[1.6%] top-[22%] h-[11%] w-[1.6%] rounded-r-sm bg-[#1b1b20]" />
      <div aria-hidden className={cn("absolute inset-0 rounded-[16%/7.4%] bg-[#0d0d10] ring-1 ring-black/40", !flat && "shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]")} />
      <div className="absolute inset-[2.6%_3.6%] overflow-hidden rounded-[13%/6%]">
        <ScaledScreen bg={screenBg} fill={fill}>{children}</ScaledScreen>
        {island && <span aria-hidden className="absolute left-1/2 top-[1.5%] h-[3.6%] w-[31%] -translate-x-1/2 rounded-full bg-black" />}
      </div>
    </div>
  );
}
