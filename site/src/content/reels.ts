import * as prismic from "@prismicio/client";
import { client } from "@/prismicio";

export type Reel = {
  id: string;
  video?: string;
  thumbnail?: string;
  caption?: string;
  link?: string;
  client?: string;
  recurringContent?: boolean;
};

// Aceita tanto os nomes de campo originais quanto os que o usuário acabou
// criando manualmente no painel do Prismic (ex: "vertical" em vez de "video").
function pick(data: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return data[key];
  }
  return undefined;
}

const VIDEO_KEYS = ["video", "vertical", "video_vertical"];
const THUMBNAIL_KEYS = ["thumbnail", "capa", "cover"];
const CAPTION_KEYS = ["caption", "legenda_curta", "legenda curta", "legenda"];
const LINK_KEYS = ["link", "link_externo", "link externo"];
const CLIENT_KEYS = ["client", "cliente"];
const RECURRING_KEYS = ["recurring_content", "conteudo_recorrente"];

function mapDoc(doc: prismic.PrismicDocument): Reel {
  const data = doc.data as Record<string, unknown>;

  const thumbnailField = pick(data, THUMBNAIL_KEYS) as prismic.ImageField | undefined;

  const rawVideo = pick(data, VIDEO_KEYS) as prismic.LinkField | prismic.LinkField[] | undefined;
  const videoField = Array.isArray(rawVideo) ? rawVideo[0] : rawVideo;

  const rawLink = pick(data, LINK_KEYS) as prismic.LinkField | prismic.LinkField[] | undefined;
  const linkField = Array.isArray(rawLink) ? rawLink[0] : rawLink;

  return {
    id: doc.id,
    thumbnail: thumbnailField?.url || undefined,
    video:
      videoField && videoField.link_type === "Media"
        ? (videoField as prismic.FilledLinkToMediaField).url
        : undefined,
    caption: (pick(data, CAPTION_KEYS) as string) || undefined,
    client: (pick(data, CLIENT_KEYS) as string | undefined)?.trim() || undefined,
    recurringContent: Boolean(pick(data, RECURRING_KEYS)),
    link:
      linkField && linkField.link_type === "Web"
        ? (linkField as prismic.FilledLinkToWebField).url
        : undefined,
  };
}

// "Últimos vídeos" — os mais recentemente publicados primeiro.
export async function getLatestReels(limit = 10): Promise<Reel[]> {
  try {
    const docs = await client.getAllByType("reel", {
      orderings: [{ field: "document.last_publication_date", direction: "desc" }],
      limit,
    });
    return docs.map(mapDoc).filter((r) => r.video);
  } catch (err) {
    console.warn("[prismic] não foi possível buscar reels:", err);
    return [];
  }
}

// Todos os reels publicados, sem limite — usado na página /portfolio.
export async function getAllReels(): Promise<Reel[]> {
  try {
    const docs = await client.getAllByType("reel", {
      orderings: [{ field: "document.last_publication_date", direction: "desc" }],
    });
    return docs.map(mapDoc).filter((r) => r.video);
  } catch (err) {
    console.warn("[prismic] não foi possível buscar reels:", err);
    return [];
  }
}
