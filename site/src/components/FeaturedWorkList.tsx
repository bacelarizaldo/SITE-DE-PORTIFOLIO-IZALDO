"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project } from "@/content/types";
import { categoryLabels } from "@/content/types";
import SectionReveal from "./SectionReveal";
import FeaturedWorkCard from "./FeaturedWorkCard";
import ProjectVideoModal from "./ProjectVideoModal";

export default function FeaturedWorkList({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<Project | null>(null);

  return (
    <>
      <div className="flex flex-col gap-20 md:gap-32">
        {projects.map((project, i) => (
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
      </div>

      <ProjectVideoModal project={active} onClose={() => setActive(null)} />
    </>
  );
}
