import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SectionReveal from "@/components/SectionReveal";
import ProjectHeroMedia from "@/components/ProjectHeroMedia";
import { getAllProjects, getProjectBySlug } from "@/content/projects";
import { categoryLabels } from "@/content/types";
import { whatsappHref } from "@/lib/site-config";

type Params = { slug: string };

export const revalidate = 60;

export async function generateStaticParams(): Promise<Params[]> {
  const projects = await getAllProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const description =
    project.description ||
    `${project.title} — ${categoryLabels[project.category]} produzido por Izaldo Bacelar (IB Films).`;

  return {
    title: project.title,
    description,
    alternates: { canonical: `/portfolio/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description,
      images: project.thumbnail
        ? [{ url: project.thumbnail, width: 1920, height: 1080, alt: project.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: project.thumbnail ? [project.thumbnail] : undefined,
    },
    // Projetos ainda com material placeholder não devem ser indexados
    // como trabalho real até o conteúdo verdadeiro entrar no ar.
    robots: project.placeholder ? { index: false, follow: true } : undefined,
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const all = await getAllProjects();
  const idx = all.findIndex((p) => p.slug === project.slug);
  const next = all.length > 0 ? all[(idx + 1) % all.length] : undefined;

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
              <div className="md:col-span-12">
                <p className="text-xs tracking-[0.2em] text-accent uppercase mb-4">
                  {categoryLabels[project.category]} · {project.year}
                </p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                  {project.title}
                </h1>
              </div>
            </div>
          </div>

          <ProjectHeroMedia project={project} />
        </section>

        <section className="mx-auto max-w-[1600px] px-6 md:px-10 py-16 md:py-24">
          <SectionReveal>
            <p className="text-lg md:text-2xl text-paper/80 leading-relaxed text-center">
              {project.description}
            </p>
          </SectionReveal>

          {project.gallery.length > 0 && (
            <div className="mt-16 md:mt-24 columns-2 md:columns-3 gap-3 md:gap-4">
              {project.gallery.map((src, i) => (
                <SectionReveal
                  key={src + i}
                  delay={(i % 3) * 80}
                  className="mb-3 md:mb-4 break-inside-avoid bg-void"
                >
                  <Image
                    src={src}
                    alt={`${project.title} — imagem ${i + 1}`}
                    width={0}
                    height={0}
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="w-full h-auto"
                  />
                </SectionReveal>
              ))}
            </div>
          )}
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-[1600px] px-6 md:px-10 py-16 md:py-24 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            {next && next.slug !== project.slug ? (
              <div>
                <p className="text-sm text-mist mb-2">Próximo projeto</p>
                <Link
                  href={`/portfolio/${next.slug}`}
                  className="text-3xl md:text-5xl font-black tracking-tight hover:text-accent transition-colors"
                >
                  {next.title} →
                </Link>
              </div>
            ) : (
              <div />
            )}
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
