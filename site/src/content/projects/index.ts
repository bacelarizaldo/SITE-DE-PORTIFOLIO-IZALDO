import type { Project, ProjectCategory } from "../types";
import p1 from "./placeholder-01";
import p2 from "./placeholder-02";
import p3 from "./placeholder-03";

// Para adicionar um projeto novo: criar um arquivo em src/content/projects/
// seguindo o mesmo formato e importar/registrar aqui. Nenhuma outra mudança
// de código é necessária — as páginas leem tudo a partir destas funções.
const allProjects: Project[] = [p1, p2, p3];

export function getAllProjects(): Project[] {
  return [...allProjects].sort((a, b) => a.order - b.order);
}

export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter((p) => p.featured);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return allProjects.find((p) => p.slug === slug);
}

export function getProjectsByCategory(category: ProjectCategory): Project[] {
  return getAllProjects().filter((p) => p.category === category);
}
