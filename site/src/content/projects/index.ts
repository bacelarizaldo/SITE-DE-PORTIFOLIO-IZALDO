import * as prismic from "@prismicio/client";
import { client } from "@/prismicio";
import type { Project, ProjectCategory } from "../types";

const FALLBACK_THUMBNAIL = "/placeholders/thumb-01.jpg";

// Converte um documento do custom type "project" (Prismic) para o formato
// que o resto do site consome. Toda edição de projeto passa a acontecer
// no painel do Prismic (izaldo-filmes.prismic.io) — nada aqui precisa
// mudar quando você adiciona um projeto novo lá.
function mapDoc(doc: prismic.PrismicDocument): Project {
  const data = doc.data as Record<string, unknown>;

  const thumbnailField = data.thumbnail as prismic.ImageField | undefined;
  // O campo "cover_video" pode ter sido configurado como link único ou
  // como lista (aparece como "Repeatable" no painel) — aceitamos os dois
  // formatos e usamos sempre o primeiro vídeo.
  const rawCoverVideo = data.cover_video as
    | prismic.LinkField
    | prismic.LinkField[]
    | undefined;
  const coverVideoField = Array.isArray(rawCoverVideo)
    ? rawCoverVideo[0]
    : rawCoverVideo;
  const galleryField = (data.gallery as { image?: prismic.ImageField }[]) ?? [];
  const servicesField = (data.services as { service?: string }[]) ?? [];

  return {
    slug: doc.uid ?? doc.id,
    title: (data.title as string) || "Sem título",
    client: (data.client as string) || "",
    category: (data.category as ProjectCategory) || "empresas",
    year: (data.year as number) || new Date().getFullYear(),
    thumbnail: thumbnailField?.url || FALLBACK_THUMBNAIL,
    coverVideo:
      coverVideoField && coverVideoField.link_type === "Media"
        ? (coverVideoField as prismic.FilledLinkToMediaField).url
        : undefined,
    gallery: galleryField
      .map((g) => g.image?.url)
      .filter((url): url is string => Boolean(url)),
    description: data.description
      ? prismic.asText(data.description as prismic.RichTextField)
      : "",
    services: servicesField
      .map((s) => s.service)
      .filter((s): s is string => Boolean(s)),
    featured: Boolean(data.featured),
    order: (data.order as number) ?? 0,
  };
}

async function fetchAllDocs(): Promise<prismic.PrismicDocument[]> {
  try {
    return await client.getAllByType("project", {
      orderings: [{ field: "my.project.order" }],
    });
  } catch (err) {
    // O custom type "project" ainda não existe no Prismic, ou o
    // repositório está vazio — não deve quebrar o build.
    console.warn("[prismic] não foi possível buscar projetos:", err);
    return [];
  }
}

export async function getAllProjects(): Promise<Project[]> {
  const docs = await fetchAllDocs();
  return docs.map(mapDoc).sort((a, b) => a.order - b.order);
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await getAllProjects();
  return all.filter((p) => p.featured).slice(0, 4);
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  try {
    const doc = await client.getByUID("project", slug);
    return mapDoc(doc);
  } catch {
    return undefined;
  }
}

export async function getProjectsByCategory(category: ProjectCategory): Promise<Project[]> {
  const all = await getAllProjects();
  return all.filter((p) => p.category === category);
}
