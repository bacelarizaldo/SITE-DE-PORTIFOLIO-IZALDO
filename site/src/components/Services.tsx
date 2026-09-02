import Link from "next/link";
import SectionReveal from "./SectionReveal";
import { services } from "@/content/services";

export default function Services() {
  return (
    <section id="servicos" className="bg-ink py-24 md:py-36">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <SectionReveal className="mb-16 md:mb-20 flex items-baseline justify-between gap-4 md:gap-6">
          <div className="flex items-baseline gap-4 md:gap-6">
            <span className="text-sm text-accent tracking-[0.2em]">04</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              O que <span className="text-mist">eu faço.</span>
            </h2>
          </div>
          <Link
            href="/servicos"
            className="hidden md:inline-block text-sm text-mist hover:text-paper transition-colors shrink-0"
          >
            Ver detalhes →
          </Link>
        </SectionReveal>

        <div className="border-t border-line">
          {services.map((s, i) => (
            <SectionReveal key={s.n} delay={i * 60}>
              <Link
                href={`/servicos#${s.slug}`}
                className="group block border-b border-line py-8 md:py-10 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-10 items-baseline transition-colors"
              >
                <span className="md:col-span-1 text-sm text-mist">{s.n}</span>
                <h3 className="md:col-span-4 text-2xl md:text-3xl font-bold group-hover:text-accent transition-colors">
                  {s.title}
                </h3>
                <p className="md:col-span-6 md:col-start-7 text-sm md:text-base text-paper/60 leading-relaxed">
                  {s.summary}
                </p>
              </Link>
            </SectionReveal>
          ))}
        </div>

        <Link
          href="/servicos"
          className="md:hidden mt-10 inline-block text-sm text-mist hover:text-paper transition-colors"
        >
          Ver detalhes →
        </Link>
      </div>
    </section>
  );
}
