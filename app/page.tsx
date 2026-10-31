import { HeroScene } from "@/components/landing/hero/hero-scene";
import { Bento } from "@/components/landing/sections/bento";
import { ChaosCalm } from "@/components/landing/sections/chaos-calm";
import { CurtainFooter } from "@/components/landing/sections/curtain-footer";
import { DarkFeatures } from "@/components/landing/sections/dark-features";
import { Ending } from "@/components/landing/sections/ending";
import { LiveTicker } from "@/components/landing/sections/live-ticker";
import { MorphNav } from "@/components/landing/sections/morph-nav";
import { PartnersWall } from "@/components/landing/sections/partners-wall";
import { PassportHall } from "@/components/landing/sections/passport-hall";
import { SmoothScroll } from "@/components/landing/sections/smooth-scroll";
import { TrustFaq } from "@/components/landing/sections/trust-faq";
import { VendorMarquee } from "@/components/landing/sections/vendor-marquee";
import { VerifyPanel } from "@/components/landing/sections/verify-panel";
import { Voices } from "@/components/landing/sections/voices";

export default function LandingPage() {
  return (
    <>
      <SmoothScroll />
      <MorphNav />
      {/* main sits above the sticky footer so its last section lifts away like a curtain */}
      <main id="main" className="relative z-10">
        <HeroScene />
        <PartnersWall />
        <DarkFeatures />
        <VerifyPanel />
        <LiveTicker />
        <ChaosCalm />
        <Bento />
        <VendorMarquee />
        <PassportHall />
        <TrustFaq />
        <Voices />
        <Ending />
      </main>
      <CurtainFooter />
    </>
  );
}
