import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { LogoWall } from "@/components/site/logo-wall";
import { Modules } from "@/components/site/modules";
import { Studios } from "@/components/site/studios";
import { Metrics } from "@/components/site/metrics";
import { Testimonials } from "@/components/site/testimonials";
import { Pricing } from "@/components/site/pricing";
import { Faq } from "@/components/site/faq";
import { Cta } from "@/components/site/cta";
import { Footer } from "@/components/site/footer";
import { StickyCta } from "@/components/site/sticky-cta";

export default function Home() {
  return (
    <main id="main-content" className="relative">
      <Nav />
      <Hero />
      <LogoWall />
      <Modules />
      <Studios />
      <Metrics />
      <Testimonials />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
      <StickyCta />
    </main>
  );
}
