import SectionReveal from "./SectionReveal";
import { whatsappHref, siteConfig } from "@/lib/site-config";

export default function CTASection() {
  return (
    <section id="contato" className="relative bg-ink py-28 md:py-44 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(232,143,79,0.07),_transparent_65%)]" aria-hidden />

      <div className="relative mx-auto max-w-[1600px] px-6 md:px-10 text-center">
        <SectionReveal>
          <p className="text-sm text-accent tracking-[0.2em] mb-6">06 — Contato</p>
          <h2 className="text-4xl md:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.02]">
            Vamos fazer seu próximo projeto <span className="text-mist">valer a pena assistir.</span>
          </h2>

          <div className="mt-12 flex flex-col items-center gap-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-paper px-9 py-4 text-base font-medium text-ink hover:bg-accent transition-colors"
            >
              Falar no WhatsApp
            </a>
            <a href={`mailto:${siteConfig.email}`} className="text-sm text-paper/60 hover:text-paper transition-colors">
              {siteConfig.email}
            </a>
            <p className="text-xs text-mist/70 mt-2">{siteConfig.location}</p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
