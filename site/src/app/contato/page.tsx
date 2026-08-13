import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import SectionReveal from "@/components/SectionReveal";
import { siteConfig, whatsappHref } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com Izaldo Bacelar (IB Films) sobre o seu próximo projeto audiovisual em Recife ou em qualquer lugar do Brasil.",
};

export default function ContatoPage() {
  return (
    <>
      <Nav />
      <main className="pt-40 pb-24 md:pb-36">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
            <SectionReveal className="md:col-span-5">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                Vamos conversar sobre o seu projeto.
              </h1>
              <p className="text-base md:text-lg text-paper/60 max-w-sm mb-10">
                Conte o tamanho, o prazo e o que você imagina. Poucos campos,
                resposta rápida.
              </p>

              <div className="flex flex-col gap-4 text-sm">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-paper/90 hover:text-accent transition-colors">
                  WhatsApp — falar agora ↗
                </a>
                <a href={`mailto:${siteConfig.email}`} className="text-paper/90 hover:text-accent transition-colors">
                  {siteConfig.email}
                </a>
                <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer" className="text-paper/90 hover:text-accent transition-colors">
                  Instagram ↗
                </a>
                <p className="text-mist mt-4">{siteConfig.location}</p>
              </div>
            </SectionReveal>

            <SectionReveal delay={100} className="md:col-span-6 md:col-start-7">
              <ContactForm />
            </SectionReveal>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
