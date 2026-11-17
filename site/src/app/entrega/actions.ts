"use server";

import { FEEDBACK_LIMITS, addFeedback, getGalleryByLink, isPhotoName, setFavoriteMarker } from "@/lib/r2";

// A galeria abre só pelo link (com o código), então quem está nela pode favoritar
export async function setFavorite(link: string, name: string, favorite: boolean) {
  const meta = await getGalleryByLink(link);
  if (!meta) throw new Error("Galeria não encontrada");
  if (!isPhotoName(name)) throw new Error("Foto inválida");
  await setFavoriteMarker(meta.slug, name, favorite);
}

export type FeedbackState = { ok?: boolean; error?: string };

// Recado geral sobre a entrega (não é sobre uma foto específica). Vai para a seção Feedback do admin.
export async function sendFeedback(link: string, _prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  // Campo escondido: pessoas não preenchem, robôs costumam preencher
  if (String(formData.get("site") ?? "")) return { ok: true };

  const meta = await getGalleryByLink(link);
  if (!meta) return { error: "Galeria não encontrada." };

  const name = String(formData.get("nome") ?? "").replace(/\s+/g, " ").trim().slice(0, FEEDBACK_LIMITS.name);
  const message = String(formData.get("mensagem") ?? "").replace(/\r\n/g, "\n").trim();
  if (message.length < 2) return { error: "Escreva o seu recado antes de enviar." };
  if (message.length > FEEDBACK_LIMITS.message) {
    return { error: `O recado pode ter até ${FEEDBACK_LIMITS.message} caracteres.` };
  }

  try {
    await addFeedback(meta.slug, { name: name || undefined, message });
    return { ok: true };
  } catch (err) {
    return { error: (err as Error).message || "Não foi possível enviar agora. Tente de novo." };
  }
}
