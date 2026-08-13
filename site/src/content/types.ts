export type ProjectCategory =
  | "empresas"
  | "redes-sociais"
  | "eventos"
  | "casamentos"
  | "fotografia";

export type Project = {
  slug: string;
  title: string;
  client: string;
  category: ProjectCategory;
  year: number;
  thumbnail: string;
  coverVideo?: string;
  gallery: string[];
  description: string;
  services: string[];
  featured: boolean;
  order: number;
  /** true enquanto o material real não foi enviado — nunca exibir como trabalho real */
  placeholder?: boolean;
};

export const categoryLabels: Record<ProjectCategory, string> = {
  empresas: "Empresas",
  "redes-sociais": "Redes Sociais",
  eventos: "Eventos",
  casamentos: "Casamentos",
  fotografia: "Fotografia",
};
