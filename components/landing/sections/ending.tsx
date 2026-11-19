import { DuesListScreen, LimitUnlockedScreen, LockScreenReminders, PassportScreen, PayReceiptScreen, PhoneFrame } from "@/components/phone-screens";
import { Reveal } from "@/components/shared/reveal";
import { COPY } from "@/lib/copy";
import { moods } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { EmailPill } from "./email-pill";
import { EndingCoins } from "./ending-coins";
import { GridField } from "./grid-field";
import { PopInGroup } from "./pop-in-group";

/** Phones lying on the desk: left %, top px, rotate deg, width px, screen, bg, hide below sm, and depth (px it shifts against the pointer). */
const DEVICES = [
  { l: 2, t: 70, r: -16, w: 210, s: <LockScreenReminders wallpaper={moods.sunset} />, bg: "#000", sm: true, d: -22 },
  { l: 20, t: 10, r: -6, w: 230, s: <DuesListScreen />, bg: "#EAF1E4", sm: false, d: 12 },
  { l: 40, t: 40, r: 4, w: 240, s: <PassportScreen />, bg: "#0b0b0c", sm: false, d: 30 },
  { l: 60, t: 0, r: 12, w: 230, s: <LimitUnlockedScreen active={false} />, bg: "#fff", sm: false, d: 14 },
  { l: 78, t: 60, r: 20, w: 210, s: <PayReceiptScreen />, bg: "#f6f5f3", sm: true, d: -20 },
];

/** Final CTA (#access): "Have a nice semester!", the early-access pill, 3D coins gathering in the margins and a flat-lay of phones that shifts with the pointer. */
export function Ending() {
  const t = COPY.landing.ending;
  return (
    <section id="access" aria-labelledby="ending-title" className="relative isolate scroll-mt-24 overflow-hidden bg-page pt-28 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] sm:pt-36 md:rounded-b-[36px]">
      <GridField seed={6} beams={8} className="h-[700px] [mask-image:radial-gradient(65%_62%_at_50%_32%,#000,transparent)]" />
      {/* the coins from the splash gather again, in the margins around the headline (ending-coins.tsx) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] sm:h-[560px]">
        <EndingCoins />
      </div>
      <div data-reveal className="relative mx-auto max-w-[1180px] px-4 text-center sm:px-6">
        <Reveal>
          <h2 id="ending-title" className="text-balance text-[clamp(2.75rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-ink">
            {t.title}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-ink-2">{t.sub}</p>
          <EmailPill className="mx-auto mt-7 w-full max-w-md text-left" />
        </Reveal>
      </div>
      <PopInGroup parallax role="img" aria-label={t.flatAlt} className="relative mx-auto mt-16 h-[360px] max-w-[1180px] sm:h-[440px]">
        {DEVICES.map((d, i) => (
          <div
            key={i}
            data-par
            className={cn("absolute", d.sm ? "hidden sm:block" : "")}
            style={{ left: `${d.l}%`, top: d.t, width: `clamp(150px, ${d.w / 11.8}vw, ${d.w}px)`, transform: `rotate(${d.r}deg)`, perspective: 900, ["--d" as string]: d.d }}
          >
            <div aria-hidden data-pop>
              <PhoneFrame fill screenBg={d.bg}>{d.s}</PhoneFrame>
            </div>
          </div>
        ))}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-page to-transparent" />
      </PopInGroup>
    </section>
  );
}
