import SectionReveal from "./SectionReveal";

export default function Authorship() {
  return (
    <section className="bg-void py-24 md:py-36 border-y border-line">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
          <SectionReveal className="md:col-span-4 flex items-baseline gap-4 md:gap-6">
            <span className="text-sm text-accent tracking-[0.2em]">03</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Quem <span className="text-mist">assina.</span>
            </h2>
          </SectionReveal>

          <SectionReveal delay={100} className="md:col-span-7 md:col-start-6">
            <p className="text-xl md:text-3xl font-medium leading-snug text-paper/90 max-w-2xl">
              Izaldo Bacelar é filmmaker e fotógrafo à frente da IB Films.
              Formado em engenharia, encontrou na imagem sua linguagem —
              direção, fotografia, cinematografia e edição reunidas em uma
              única visão.
            </p>
            <p className="mt-6 text-base text-paper/60 max-w-xl leading-relaxed">
              O trabalho não é registrar o que acontece — é decidir o que
              importa mostrar. Cada projeto é pensado antes de ser filmado.
            </p>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
