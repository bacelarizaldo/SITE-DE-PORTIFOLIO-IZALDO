"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Project, ProjectCategory } from "@/content/types";
import { categoryLabels } from "@/content/types";
import SectionReveal from "./SectionReveal";
import FeaturedWorkCard from "./FeaturedWorkCard";
import ProjectVideoModal from "./ProjectVideoModal";

type Filter = ProjectCategory | "todos";

export default function PortfolioGrid({ projects }: { projects: Project[] }) {
  const availableCategories = useMemo(() => {
    const set = new Set<ProjectCategory>(projects.map((p) => p.category));
    return Array.from(set);
  }, [projects]);

  const [filter, setFilter] = useState<Filter>("todos");
  const [active, setActive] = useState<Project | null>(null);

  const filtered = useMemo(
    () => (filter === "todos" ? projects : projects.filter((p) => p.category === filter)),
    [projects, filter]
  );

  return (
    <div>
      <div className="mb-16 md:mb-20 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <button
          type="button"
          onClick={() => setFilter("todos")}
          className={`tracking-wide transition-colors ${
            filter === "todos" ? "text-paper" : "text-mist hover:text-paper/80"
          }`}
        >
          Todos
        </button>
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`tracking-wide transition-colors ${
              filter === cat ? "text-paper" : "text-mist hover:text-paper/80"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-20 md:gap-32">
        {filtered.map((project, i) => (
          <SectionReveal
            key={project.slug}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center"
          >
            <FeaturedWorkCard
              project={project}
              reversed={i % 2 === 1}
              onOpenVideo={setActive}
            />

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

        {filtered.length === 0 && (
          <p className="text-sm text-mist">Nenhum projeto nessa categoria ainda.</p>
        )}
      </div>

      <ProjectVideoModal project={active} onClose={() => setActive(null)} />
    </div>
  );
}
