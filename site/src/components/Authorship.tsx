import Image from "next/image";
import Link from "next/link";
import SectionReveal from "./SectionReveal";
import { getSiteSettings } from "@/content/settings";

export default async function Authorship() {
  const { sobrePhoto } = await getSiteSettings();

  return (
    <section className="bg-void py-24 md:py-36 border-y border-line">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
          <SectionReveal className="md:col-span-4 flex flex-col gap-8">
            <div className="flex items-baseline gap-4 md:gap-6">
              <span className="text-sm text-accent tracking-[0.2em]">03</span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Quem <span className="text-mist">assina.</span>
              </h2>
            </div>

            {sobrePhoto && (
              <div className="relative w-[140px] md:w-[180px] aspect-[3/4] bg-ink">
                <Image
                  src={sobrePhoto}
                  alt="Izaldo Bacelar, filmmaker e fotógrafo em Recife"
                  fill
                  sizes="180px"
                  className="object-cover"
                />
              </div>
            )}
          </SectionReveal>

          <SectionReveal delay={100} className="md:col-span-7 md:col-start-6">
            <p className="text-xl md:text-3xl font-medium leading-snug text-paper/90 max-w-2xl">
              Izaldo Bacelar é filmmaker e fotógrafo à frente da IB Films.
              Formado em engenharia da computação, encontrou na imagem sua
              linguagem — direção, fotografia, cinematografia e edição
              reunidas em uma única visão.
            </p>
            <p className="mt-6 text-base text-paper/60 max-w-xl leading-relaxed">
              O trabalho não é registrar o que acontece — é decidir o que
              importa mostrar. Cada projeto é pensado antes de ser filmado.
            </p>
            <p className="mt-4 text-sm text-mist max-w-xl leading-relaxed">
              Baseado em Recife, Pernambuco, atende projetos em todo o Brasil
              há mais de quatro anos.
            </p>

            <Link
              href="/sobre"
              className="mt-8 inline-flex items-center gap-2 text-sm text-paper/80 hover:text-accent transition-colors"
            >
              Conhecer a trajetória completa
              <span aria-hidden>→</span>
            </Link>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
