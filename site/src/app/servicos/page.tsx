import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SectionReveal from "@/components/SectionReveal";
import { services } from "@/content/services";
import { whatsappHref } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Filmes para empresas, conteúdo para redes sociais, eventos, casamentos e fotografia — direção, captação e edição com Izaldo Bacelar (IB Films) em Recife.",
  alternates: { canonical: "/servicos" },
};

export default function ServicosPage() {
  return (
    <>
      <Nav />
      <main className="pt-40 pb-24 md:pb-36">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">O que eu faço.</h1>
          <p className="text-base md:text-lg text-paper/60 max-w-xl mb-16 md:mb-24">
            Direção, fotografia, captação e edição — em uma só visão, para
            cinco frentes de trabalho.
          </p>

          <div className="border-t border-line">
            {services.map((s) => (
              <SectionReveal key={s.slug} id={s.slug} as="section" className="scroll-mt-28">
                <div className="border-b border-line py-14 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
                  <div className="md:col-span-4">
                    <span className="text-sm text-accent tracking-[0.2em]">{s.n}</span>
                    <h2 className="text-3xl md:text-4xl font-bold mt-3">{s.title}</h2>
                  </div>
                  <div className="md:col-span-7 md:col-start-6">
                    <p className="text-base md:text-lg text-paper/80 leading-relaxed max-w-2xl">
                      {s.summary}
                    </p>
                    <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-2 text-sm text-mist">
                      {s.deliverables.map((d, i) => (
                        <li key={d} className="flex items-center gap-3">
                          {d}
                          {i < s.deliverables.length - 1 && (
                            <span className="text-line" aria-hidden>
                              ·
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>

          <div className="mt-16 md:mt-24 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <p className="text-2xl md:text-3xl font-bold max-w-lg">
              Qual desses é o seu próximo projeto?
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-ink hover:bg-accent transition-colors"
            >
              Vamos conversar
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
