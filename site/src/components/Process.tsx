import SectionReveal from "./SectionReveal";

const steps = [
  { n: "01", title: "Conversa", desc: "Entender o projeto, o objetivo e o contexto." },
  { n: "02", title: "Conceito", desc: "Definir linguagem visual, referências e direção." },
  { n: "03", title: "Produção", desc: "Captação com equipe e equipamento certos para o projeto." },
  { n: "04", title: "Pós-produção", desc: "Montagem, tratamento de imagem, som e finalização." },
  { n: "05", title: "Entrega", desc: "Arquivos finais preparados para cada plataforma." },
];

export default function Process() {
  return (
    <section id="processo" className="bg-void py-24 md:py-36 border-y border-line">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <SectionReveal className="mb-16 md:mb-24 flex items-baseline gap-4 md:gap-6">
          <span className="text-sm text-accent tracking-[0.2em]">04</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Como <span className="text-mist">funciona.</span>
          </h2>
        </SectionReveal>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-12 gap-x-6">
          {steps.map((step, i) => (
            <SectionReveal key={step.n} delay={i * 80}>
              <span className="block text-sm text-accent tracking-[0.2em] mb-4">{step.n}</span>
              <h3 className="text-lg md:text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-paper/60 leading-relaxed max-w-[22ch]">{step.desc}</p>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
