import * as prismic from "@prismicio/client";
import { client } from "@/prismicio";

export type SiteSettings = {
  heroImage?: string;
  heroVideo?: string;
  sobrePhoto?: string;
  recurringContentAboutPhoto?: string;
  recurringContentVideo?: string;
};

// Busca o documento singleton "settings" no Prismic (Home hero, foto da
// página Sobre, etc). Se ainda não existir, retorna vazio e as páginas
// caem de volta nos placeholders — não deve quebrar o build.
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const doc = await client.getSingle("settings");
    const data = doc.data as Record<string, unknown>;

    const heroImageField = data.hero_image as prismic.ImageField | undefined;
    const sobrePhotoField = data.sobre_photo as prismic.ImageField | undefined;
    const recurringContentAboutPhotoField = data.recurring_content_about_photo as
      | prismic.ImageField
      | undefined;
    const rawRecurringContentVideo = data.recurring_content_video as
      | prismic.LinkField
      | prismic.LinkField[]
      | undefined;
    const recurringContentVideoField = Array.isArray(rawRecurringContentVideo)
      ? rawRecurringContentVideo[0]
      : rawRecurringContentVideo;
    const rawHeroVideo = data.hero_video as
      | prismic.LinkField
      | prismic.LinkField[]
      | undefined;
    const heroVideoField = Array.isArray(rawHeroVideo) ? rawHeroVideo[0] : rawHeroVideo;

    return {
      heroImage: heroImageField?.url || undefined,
      heroVideo:
        heroVideoField && heroVideoField.link_type === "Media"
          ? (heroVideoField as prismic.FilledLinkToMediaField).url
          : undefined,
      sobrePhoto: sobrePhotoField?.url || undefined,
      recurringContentAboutPhoto: recurringContentAboutPhotoField?.url || undefined,
      recurringContentVideo:
        recurringContentVideoField && recurringContentVideoField.link_type === "Media"
          ? (recurringContentVideoField as prismic.FilledLinkToMediaField).url
          : undefined,
    };
  } catch (err) {
    console.warn("[prismic] não foi possível buscar settings:", err);
    return {};
  }
}
