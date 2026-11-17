import { GALLERY_COVER, coverPhoto, fileKey, getGalleryByLink, isConfigured, listGalleryFiles, sortVideos, videoCoverName } from "@/lib/r2";

/** Chave no R2 da imagem usada na prévia do link: a mesma ordem de escolha da capa da página */
export async function previewCoverKey(link: string) {
  if (!isConfigured()) return undefined;
  const meta = await getGalleryByLink(link);
  if (!meta) return undefined;
  const slug = meta.slug;
  const files = await listGalleryFiles(slug);
  const covers = new Set(files.covers.map((f) => f.name));
  if (covers.has(GALLERY_COVER)) return fileKey(slug, "covers", GALLERY_COVER);
  const name = coverPhoto(meta, files.photos.map((f) => f.name));
  if (name) {
    const derived = `${name}.jpg`;
    if (files.web.some((f) => f.name === derived)) return `galleries/${slug}/web/${derived}`;
    return files.photos.find((f) => f.name === name)?.key;
  }
  const video = sortVideos(meta, files.videos).find((v) => covers.has(videoCoverName(v.name)));
  return video ? fileKey(slug, "covers", videoCoverName(video.name)) : undefined;
}
