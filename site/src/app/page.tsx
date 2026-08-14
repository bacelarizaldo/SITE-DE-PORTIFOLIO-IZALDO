import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import FeaturedWork from "@/components/FeaturedWork";
import Authorship from "@/components/Authorship";
import Services from "@/components/Services";
import Process from "@/components/Process";
import CTASection from "@/components/CTASection";

// Revalida a cada 60s para refletir edições feitas no painel do Prismic
// sem precisar de um novo deploy.
export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FeaturedWork />
        <Authorship />
        <Services />
        <Process />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
