import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderTag from "@/components/PlaceholderTag";
import SectionReveal from "@/components/SectionReveal";
import { equipment } from "@/content/equipment";
import { whatsappHref } from "@/lib/site-config";
import { getSiteSettings } from "@/content/settings";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Izaldo Bacelar é filmmaker e fotógrafo à frente da IB Films, em Recife — direção, fotografia, cinematografia e edição em uma só visão.",
  alternates: { canonical: "/sobre" },
};

export const revalidate = 60;

export default async function SobrePage() {
  const { sobrePhoto } = await getSiteSettings();

  return (
    <>
      <Nav />
      <main className="pt-40 pb-24 md:pb-36">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
            <SectionReveal className="md:col-span-5">
              <div className="relative aspect-[4/5] bg-void">
                <Image
                  src={sobrePhoto || "/placeholders/portrait.jpg"}
                  alt="Izaldo Bacelar"
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                  priority
                />
                {!sobrePhoto && <PlaceholderTag className="absolute top-4 left-4" />}
              </div>
            </SectionReveal>

            <div className="md:col-span-6 md:col-start-7">
              <SectionReveal>
                <p className="text-xs tracking-[0.2em] text-accent uppercase mb-6">Sobre</p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-8">
                  Izaldo Bacelar é filmmaker e fotógrafo à frente da IB Films.
                </h1>
              </SectionReveal>

              <SectionReveal delay={100} className="space-y-5 text-base md:text-lg text-paper/75 leading-relaxed max-w-xl">
                <p>
                  Formado em engenharia da computação, encontrou na imagem
                  sua linguagem. Há mais de quatro anos produz filmes e
                  fotografias para empresas, marcas, profissionais, eventos,
                  casamentos e projetos institucionais.
                </p>
                <p>
                  O trabalho reúne direção, fotografia, cinematografia,
                  composição, iluminação, captação e edição — tudo pensado
                  antes de ser filmado. Não é sobre registrar o que acontece,
                  é sobre decidir o que importa mostrar.
                </p>
                <p>
                  Em casamentos, o propósito é simples: que o dia seja
                  contado de um jeito que valha a pena rever — hoje e daqui a
                  dez anos.
                </p>
                <p className="text-paper/50 text-sm">
                  Recife, Pernambuco — atendendo projetos em todo o Brasil.
                </p>
              </SectionReveal>

              <SectionReveal delay={200} className="mt-10">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-ink hover:bg-accent transition-colors"
                >
                  Vamos conversar
                </a>
              </SectionReveal>
            </div>
          </div>

          <SectionReveal className="mt-24 md:mt-36 pt-14 md:pt-20 border-t border-line">
            <p className="text-xs tracking-[0.2em] text-mist uppercase mb-8">Equipamento</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-3xl">
              <div>
                <p className="text-sm text-accent mb-3">Câmeras</p>
                <ul className="space-y-1.5 text-paper/70 text-sm">
                  {equipment.cameras.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm text-accent mb-3">Lentes</p>
                <ul className="space-y-1.5 text-paper/70 text-sm">
                  {equipment.lentes.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm text-accent mb-3">Drone</p>
                <ul className="space-y-1.5 text-paper/70 text-sm">
                  {equipment.drone.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionReveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
