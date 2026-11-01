import Link from "next/link";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

/*
 * Kredo brand artwork (source files in public/brand): a signal-yellow tile holding a black "K" mark, and the
 * lowercase "kredo" wordmark. The mark is one fixed picture (it reads on white, dark and yellow surfaces alike);
 * the wordmark takes the surrounding text colour, so it is black on light surfaces and white on dark ones.
 */

const ICON_SRC = "/brand/kredo-icon-yellow-black.svg";

const WORDMARK_PATH =
  "M92.69 0.0 53.59 -53.82V0.0H14.26V-170.20000000000002H53.59V-76.13000000000001L92.46000000000001 -128.34H140.99L87.63000000000001 -63.940000000000005L141.45000000000002 0.0Z M231.38 -129.72V-88.09H220.57Q205.85 -88.09 198.49 -81.765Q191.13 -75.44 191.13 -59.57V0.0H151.79999999999998V-128.34H191.13V-106.95Q198.03 -117.53 208.38 -123.625Q218.73 -129.72 231.38 -129.72Z M365.93 -54.74H276.92Q277.84 -42.78 284.625 -36.455Q291.40999999999997 -30.130000000000003 301.3 -30.130000000000003Q316.02 -30.130000000000003 321.77 -42.550000000000004H363.63Q360.40999999999997 -29.900000000000002 352.015 -19.78Q343.62 -9.66 330.97 -3.91Q318.32 1.84 302.68 1.84Q283.82 1.84 269.1 -6.21Q254.38 -14.26 246.1 -29.21Q237.82 -44.160000000000004 237.82 -64.17Q237.82 -84.18 245.985 -99.13Q254.15 -114.08 268.87 -122.13Q283.59 -130.18 302.68 -130.18Q321.31 -130.18 335.8 -122.36000000000001Q350.29 -114.54 358.45500000000004 -100.05000000000001Q366.62 -85.56 366.62 -66.24000000000001Q366.62 -60.720000000000006 365.93 -54.74ZM326.37 -76.59Q326.37 -86.71000000000001 319.47 -92.69Q312.57 -98.67 302.22 -98.67Q292.33 -98.67 285.54499999999996 -92.92Q278.76 -87.17 277.15 -76.59Z M431.48 -130.18Q444.13000000000005 -130.18 454.595 -124.89000000000001Q465.06000000000006 -119.60000000000001 471.04 -110.63000000000001V-170.20000000000002H510.37V0.0H471.04V-18.400000000000002Q465.52000000000004 -9.200000000000001 455.2850000000001 -3.6800000000000006Q445.05000000000007 1.84 431.48 1.84Q415.61 1.84 402.73 -6.325Q389.85 -14.49 382.375 -29.555000000000003Q374.90000000000003 -44.620000000000005 374.90000000000003 -64.4Q374.90000000000003 -84.18 382.375 -99.13Q389.85 -114.08 402.73 -122.13Q415.61 -130.18 431.48 -130.18ZM442.98 -95.91000000000001Q431.25000000000006 -95.91000000000001 423.08500000000004 -87.51500000000001Q414.92 -79.12 414.92 -64.4Q414.92 -49.68 423.08500000000004 -41.055Q431.25000000000006 -32.43 442.98 -32.43Q454.71000000000004 -32.43 462.875 -40.94Q471.04 -49.45 471.04 -64.17Q471.04 -78.89 462.875 -87.4Q454.71000000000004 -95.91000000000001 442.98 -95.91000000000001Z M526.47 -64.17Q526.47 -83.95 535.21 -99.015Q543.9499999999999 -114.08 559.1299999999999 -122.13Q574.31 -130.18 593.17 -130.18Q612.03 -130.18 627.21 -122.13Q642.39 -114.08 651.13 -99.015Q659.87 -83.95 659.87 -64.17Q659.87 -44.39 651.015 -29.325Q642.16 -14.26 626.865 -6.21Q611.5699999999999 1.84 592.71 1.84Q573.85 1.84 558.7850000000001 -6.21Q543.72 -14.26 535.095 -29.21Q526.47 -44.160000000000004 526.47 -64.17ZM619.85 -64.17Q619.85 -79.58 612.145 -87.86Q604.4399999999999 -96.14 593.17 -96.14Q581.67 -96.14 574.0799999999999 -87.975Q566.49 -79.81 566.49 -64.17Q566.49 -48.760000000000005 573.9649999999999 -40.480000000000004Q581.4399999999999 -32.2 592.71 -32.2Q603.98 -32.2 611.915 -40.480000000000004Q619.85 -48.760000000000005 619.85 -64.17Z";

function MarkImage({ className }: { className?: string }) {
  // a static SVG: next/image does not optimise SVG, so a plain img is the right element
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ICON_SRC} alt="" aria-hidden draggable={false} className={cn("select-none", className)} />;
}

/** The Kredo app mark (the yellow tile). Square; sized with a size class. */
export function LogoMark({ className }: { className?: string }) {
  return <MarkImage className={cn("size-8 shrink-0", className)} />;
}

/** The lowercase "kredo" wordmark, in the surrounding text colour. Sized by height (its box is cropped to the glyphs). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="14 -170.5 646 172.5" role="img" aria-label={BRAND.name} className={cn("h-[17px] w-auto shrink-0 fill-current", className)}>
      <path d={WORDMARK_PATH} />
    </svg>
  );
}

/** Mark + wordmark side by side, sized by height (the wordmark is about half the tile's height). */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span role="img" aria-label={BRAND.name} className={cn("inline-flex h-8 shrink-0 items-center gap-2", className)}>
      <MarkImage className="aspect-square h-full w-auto" />
      <Wordmark className="h-[52%]" />
    </span>
  );
}

/** Mark + wordmark as a link home (headers and sidebars). */
export function Logo({ href = "/", className, wordmark = true }: { href?: string; className?: string; wordmark?: boolean }) {
  return (
    <Link href={href} aria-label={`${BRAND.name} home`} className={cn("inline-flex min-h-11 items-center gap-2", className)}>
      <LogoMark />
      {wordmark && <Wordmark />}
    </Link>
  );
}
