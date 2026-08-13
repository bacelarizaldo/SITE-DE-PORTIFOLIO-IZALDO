import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderTag from "@/components/PlaceholderTag";
import SectionReveal from "@/components/SectionReveal";
import { getAllProjects, getProjectBySlug } from "@/content/projects";
import { categoryLabels } from "@/content/types";
import { whatsappHref } from "@/lib/site-config";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const all = getAllProjects();
  const idx = all.findIndex((p) => p.slug === project.slug);
  const next = all[(idx + 1) % all.length];

  return (
    <>
      <Nav />
      <main>
        <section className="relative pt-36 md:pt-44">
          <div className="mx-auto max-w-[1600px] px-6 md:px-10">
            <Link href="/portfolio" className="text-sm text-mist hover:text-paper transition-colors">
              ← Portfólio
            </Link>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
              <div className="md:col-span-8">
                <p className="text-xs tracking-[0.2em] text-accent uppercase mb-4">
                  {categoryLabels[project.category]} · {project.year}
                </p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                  {project.title}
                </h1>
              </div>
              <div className="md:col-span-3 md:col-start-10 flex flex-col gap-4 text-sm">
                <div>
                  <p className="text-mist mb-1">Cliente</p>
                  <p className="text-paper/90">{project.client}</p>
                </div>
                <div>
                  <p className="text-mist mb-1">Serviços</p>
                  <p className="text-paper/90">{project.services.join(", ")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-12 md:mt-16 aspect-[16/9] w-full bg-void">
            <Image
              src={project.thumbnail}
              alt={`${project.title} — ${project.client}`}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
            {project.placeholder && <PlaceholderTag className="absolute top-6 left-6" />}
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-6 md:px-10 py-16 md:py-24">
          <SectionReveal className="max-w-2xl">
            <p className="text-lg md:text-2xl text-paper/80 leading-relaxed">
              {project.description}
            </p>
          </SectionReveal>

          {project.gallery.length > 0 && (
            <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {project.gallery.map((src, i) => (
                <SectionReveal key={src + i} delay={i * 80} className="relative aspect-[4/3] bg-void">
                  <Image
                    src={src}
                    alt={`${project.title} — imagem ${i + 1}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </SectionReveal>
              ))}
            </div>
          )}
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-[1600px] px-6 md:px-10 py-16 md:py-24 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="text-sm text-mist mb-2">Próximo projeto</p>
              <Link
                href={`/portfolio/${next.slug}`}
                className="text-3xl md:text-5xl font-black tracking-tight hover:text-accent transition-colors"
              >
                {next.title} →
              </Link>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-ink hover:bg-accent transition-colors"
            >
              Falar sobre um projeto assim
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
