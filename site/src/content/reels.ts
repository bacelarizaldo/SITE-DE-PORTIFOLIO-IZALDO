import * as prismic from "@prismicio/client";
import { client } from "@/prismicio";

export type Reel = {
  id: string;
  video?: string;
  thumbnail?: string;
  caption?: string;
  link?: string;
};

function mapDoc(doc: prismic.PrismicDocument): Reel {
  const data = doc.data as Record<string, unknown>;

  const thumbnailField = data.thumbnail as prismic.ImageField | undefined;

  const rawVideo = data.video as prismic.LinkField | prismic.LinkField[] | undefined;
  const videoField = Array.isArray(rawVideo) ? rawVideo[0] : rawVideo;

  const rawLink = data.link as prismic.LinkField | prismic.LinkField[] | undefined;
  const linkField = Array.isArray(rawLink) ? rawLink[0] : rawLink;

  return {
    id: doc.id,
    thumbnail: thumbnailField?.url || undefined,
    video:
      videoField && videoField.link_type === "Media"
        ? (videoField as prismic.FilledLinkToMediaField).url
        : undefined,
    caption: (data.caption as string) || undefined,
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
