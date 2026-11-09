import { HeroScene } from "@/components/landing/hero/hero-scene";
import { Bento } from "@/components/landing/sections/bento";
import { CardStrip } from "@/components/landing/sections/card-strip";
import { ChaosCalm } from "@/components/landing/sections/chaos-calm";
import { CornerQr } from "@/components/landing/sections/corner-qr";
import { CurtainFooter } from "@/components/landing/sections/curtain-footer";
import { DarkFeatures } from "@/components/landing/sections/dark-features";
import { Ending } from "@/components/landing/sections/ending";
import { MorphNav } from "@/components/landing/sections/morph-nav";
import { PassportHall } from "@/components/landing/sections/passport-hall";
import { SectionFx } from "@/components/landing/sections/section-fx";
import { ScenesStage } from "@/components/landing/sections/scenes-stage";
import { ScrollProgress } from "@/components/landing/sections/scroll-progress";
import { SmoothScroll } from "@/components/landing/sections/smooth-scroll";
import { SpotlightFx } from "@/components/landing/sections/spotlight-fx";
import { TrustFaq } from "@/components/landing/sections/trust-faq";
import { VerifyPanel } from "@/components/landing/sections/verify-panel";

export default function LandingPage() {
  return (
    <>
      <SmoothScroll />
      <SectionFx />
      <ScrollProgress />
      <SpotlightFx />
      <MorphNav />
      <CornerQr />
      {/* main sits above the sticky footer so its last section lifts away like a curtain */}
      <main id="main" className="relative z-10">
        <HeroScene />
        <DarkFeatures />
        <VerifyPanel />
        <ChaosCalm />
        <Bento />
        <ScenesStage />
        <CardStrip />
        <PassportHall />
        <TrustFaq />
        <Ending />
      </main>
      <CurtainFooter />
    </>
  );
}
