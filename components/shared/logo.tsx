import Link from "next/link";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

/*
 * Kredo brand artwork (source file in public/brand): a rounded black "K" with a round dot at its upper right.
 *
 *  - Glyph (`Wordmark`, `LogoLockup`, `Logo`): the K and dot take the surrounding text colour (dark on light surfaces,
 *    white on dark ones), so they need no light or dark variant.
 *  - Mark (`LogoMark`): the K on a brand-yellow rounded tile. It is the app icon.
 */

const ICON_SRC = "/brand/kredo-icon.svg";

function MarkImage({ className }: { className?: string }) {
  // a static SVG: next/image does not optimise SVG, so a plain img is the right element
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ICON_SRC} alt="" aria-hidden draggable={false} className={cn("select-none", className)} />;
}

/** The Kredo app mark: the coin on a dark tile. Square; sized with a size class. */
export function LogoMark({ className }: { className?: string }) {
  return <MarkImage className={cn("size-8 shrink-0", className)} />;
}

/** The K and its dot, in the icon's coordinate space. */
function GlyphShapes() {
  return (
    <>
      <circle cx="712" cy="293" r="64" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth="130" strokeLinecap="round" strokeLinejoin="round">
        <path d="M371 355V785" />
        <path d="M371 400 500 570 371 740Z" fill="currentColor" strokeWidth="40" />
        <path d="M605 396 440 560 620 752" />
      </g>
    </>
  );
}

/** The K glyph without a tile. Sized by height; it takes the surrounding text colour. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="300 225 480 630" role="img" aria-label={BRAND.name} className={cn("h-[28px] w-auto shrink-0", className)}>
      <GlyphShapes />
    </svg>
  );
}

/** The glyph inside a box sized by height (cards, documents, footers). */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-8 shrink-0 items-center", className)}>
      <Wordmark className="h-full" />
    </span>
  );
}

/** The glyph as a link home (headers and sidebars). `wordmark={false}` shows the coin tile alone. */
export function Logo({ href = "/", className, wordmark = true }: { href?: string; className?: string; wordmark?: boolean }) {
  return (
    <Link href={href} aria-label={`${BRAND.name} home`} className={cn("inline-flex min-h-11 items-center", className)}>
      {wordmark ? <Wordmark /> : <LogoMark />}
    </Link>
  );
}
