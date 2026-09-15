"use client";

import { useMemo, useState } from "react";
import type { Project, ProjectCategory } from "@/content/types";
import { categoryLabels } from "@/content/types";
import SectionReveal from "./SectionReveal";
import ProjectCompactCard from "./ProjectCompactCard";
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
      <div className="mb-12 md:mb-16 flex flex-wrap gap-x-8 gap-y-3 text-sm">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10 md:gap-x-6 md:gap-y-12">
        {filtered.map((project, i) => (
          <SectionReveal key={project.slug} delay={(i % 4) * 60}>
            <ProjectCompactCard project={project} onOpenVideo={setActive} />
          </SectionReveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-mist">Nenhum projeto nessa categoria ainda.</p>
      )}

      <ProjectVideoModal project={active} onClose={() => setActive(null)} />
    </div>
  );
}
