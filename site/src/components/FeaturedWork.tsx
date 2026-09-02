import Link from "next/link";
import { getFeaturedProjects } from "@/content/projects";
import SectionReveal from "./SectionReveal";
import FeaturedWorkList from "./FeaturedWorkList";

export default async function FeaturedWork() {
  const projects = await getFeaturedProjects();

  return (
    <section id="trabalhos" className="bg-ink py-24 md:py-36">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <SectionReveal className="mb-16 md:mb-24 flex items-baseline justify-between gap-4 md:gap-6">
          <div className="flex items-baseline gap-4 md:gap-6">
            <span className="text-sm text-accent tracking-[0.2em]">01</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Trabalhos <span className="text-mist">selecionados.</span>
            </h2>
          </div>
          <Link
            href="/portfolio"
            className="hidden md:inline-block text-sm text-mist hover:text-paper transition-colors shrink-0"
          >
            Ver portfólio completo →
          </Link>
        </SectionReveal>

        {projects.length === 0 && (
          <p className="text-sm text-mist">
            Os primeiros trabalhos estão a caminho — em breve por aqui.
          </p>
        )}

        <FeaturedWorkList projects={projects} />

        <Link
          href="/portfolio"
          className="md:hidden mt-16 inline-block text-sm text-mist hover:text-paper transition-colors"
        >
          Ver portfólio completo →
        </Link>
      </div>
    </section>
  );
}
