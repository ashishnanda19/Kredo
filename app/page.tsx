import { HeroScene } from "@/components/landing/hero/hero-scene";
import { DarkFeatures } from "@/components/landing/sections/dark-features";
import { MorphNav } from "@/components/landing/sections/morph-nav";
import { PartnersWall } from "@/components/landing/sections/partners-wall";
import { SmoothScroll } from "@/components/landing/sections/smooth-scroll";

export default function LandingPage() {
  return (
    <>
      <SmoothScroll />
      <MorphNav />
      <main id="main" className="relative">
        <HeroScene />
        <PartnersWall />
        <DarkFeatures />
      </main>
    </>
  );
}
