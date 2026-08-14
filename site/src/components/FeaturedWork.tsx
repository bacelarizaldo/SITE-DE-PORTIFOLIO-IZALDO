import Image from "next/image";
import Link from "next/link";
import { getFeaturedProjects } from "@/content/projects";
import { categoryLabels } from "@/content/types";
import SectionReveal from "./SectionReveal";
import PlaceholderTag from "./PlaceholderTag";

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

        <div className="flex flex-col gap-20 md:gap-32">
          {projects.map((project, i) => (
            <SectionReveal
              key={project.slug}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center"
            >
              <Link
                href={`/portfolio/${project.slug}`}
                className={`md:col-span-8 relative aspect-[16/10] overflow-hidden bg-void block group ${
                  i % 2 === 1 ? "md:order-2" : ""
                }`}
              >
                <Image
                  src={project.thumbnail}
                  alt={`${project.title} — ${project.client}`}
                  fill
                  sizes="(min-width: 768px) 66vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                {project.placeholder && (
                  <PlaceholderTag className="absolute top-4 left-4" />
                )}
              </Link>

              <div className={`md:col-span-4 ${i % 2 === 1 ? "md:order-1" : ""}`}>
                <p className="text-xs tracking-[0.2em] text-accent uppercase mb-3">
                  {categoryLabels[project.category]} · {project.year}
                </p>
                <Link href={`/portfolio/${project.slug}`}>
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 hover:text-accent transition-colors">
                    {project.title}
                  </h3>
                </Link>
                <p className="text-sm text-mist mb-4">{project.client}</p>
                <p className="text-sm text-paper/70 leading-relaxed">{project.description}</p>
              </div>
            </SectionReveal>
          ))}
        </div>

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
