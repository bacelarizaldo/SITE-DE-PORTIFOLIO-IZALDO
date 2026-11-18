"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  CATEGORIES,
  GALLERY_COVER,
  assertKeyInGallery,
  deleteGallery as removeGallery,
  deleteFeedback as removeFeedback,
  deleteKeys,
  fileKey,
  galleryAlbums,
  galleryPrefix,
  getMeta,
  isConfigured,
  isPhotoName,
  isValidSlug,
  listGalleryFiles,
  newAccessKey,
  putMeta,
  isMonth,
  sanitizeFileName,
  videoCoverName,
  type Category,
} from "@/lib/r2";
import { SCREENS, normalizeCrop, type CoverCrops } from "@/lib/coverCrop";
import { checkAdminPassword, endAdminSession, requireAdmin, startAdminSession } from "@/lib/auth";

export type FormState = { error?: string; ok?: string };

export async function adminLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isConfigured()) return { error: "Configure as variáveis de ambiente primeiro." };
  if (!checkAdminPassword(String(formData.get("senha") ?? ""))) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Senha incorreta." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await endAdminSession();
  redirect("/admin");
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function createGallery(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim() || undefined;
  const slug = slugify(String(formData.get("slug") ?? "") || title);

  if (!title) return { error: "Informe o cliente ou o projeto." };
  if (!isValidSlug(slug)) return { error: "Link inválido. Use letras, números e hífen." };
  if (await getMeta(slug)) return { error: `Já existe uma entrega com o link "${slug}".` };

  await putMeta({ slug, title, date, accessKey: newAccessKey(), createdAt: new Date().toISOString() });
  redirect(`/admin/${slug}`);
}

export async function updateGallery(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const meta = await getMeta(String(formData.get("slug") ?? ""));
  if (!meta) return { error: "Entrega não encontrada." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Informe o cliente ou o projeto." };
  meta.title = title;
  meta.date = String(formData.get("date") ?? "").trim() || undefined;

  await putMeta(meta);
  revalidatePath(`/admin/${meta.slug}`);
  return { ok: "Dados atualizados." };
}

export async function deleteGallery(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!isValidSlug(slug)) return;
  await removeGallery(slug);
  redirect("/admin");
}

export async function deleteFile(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const key = String(formData.get("key") ?? "");
  assertKeyInGallery(slug, key);

  const keys = [key];
  const prefix = galleryPrefix(slug);
  const [dir, ...rest] = key.slice(prefix.length).split("/");
  const name = rest.join("/");
  if (dir === "photos") {
    keys.push(`${prefix}thumbs/${name}.jpg`, `${prefix}web/${name}.jpg`, `${prefix}favorites/${name}`);
  }
  if (dir === "videos") keys.push(fileKey(slug, "covers", videoCoverName(name)));
  await deleteKeys(keys);
  if (dir === "videos") await forgetVideoTitles(slug, [name]);
  revalidatePath(`/admin/${slug}`);
}

async function forgetVideoTitles(slug: string, names: string[]) {
  const meta = await getMeta(slug);
  const has = (map?: Record<string, string>) => map && names.some((n) => n in map);
  if (!meta || (!has(meta.videoTitles) && !has(meta.videoMonths))) return;
  for (const n of names) {
    delete meta.videoTitles?.[n];
    delete meta.videoMonths?.[n];
  }
  await putMeta(meta);
}

/** Salva a ordem dos vídeos (o primeiro é o que abre na página de entrega). */
export async function setVideoOrder(slug: string, names: string[]): Promise<FormState> {
  await requireAdmin();
  const meta = await getMeta(slug);
  if (!meta) return { error: "Entrega não encontrada." };
  if (!names.every((n) => n && n === sanitizeFileName(n))) return { error: "Vídeo inválido." };
  meta.videoOrder = [...new Set(names)].slice(0, 500);
  await putMeta(meta);
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/entrega/${slug}`);
  return { ok: "Ordem salva." };
}

export async function setVideoTitle(slug: string, name: string, title: string): Promise<FormState> {
  await requireAdmin();
  const meta = await getMeta(slug);
  if (!meta) return { error: "Entrega não encontrada." };
  if (!name || name !== sanitizeFileName(name)) return { error: "Vídeo inválido." };

  const clean = title.trim().slice(0, 120);
  const titles = { ...meta.videoTitles };
  // Título vazio volta a usar o nome do arquivo
  if (clean) titles[name] = clean;
  else delete titles[name];
  meta.videoTitles = titles;
  await putMeta(meta);
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/entrega/${slug}`);
  return { ok: "Título salvo." };
}

/** Mês do vídeo na entrega ("2026-11"); vazio volta a usar o mês do envio */
export async function setVideoMonth(slug: string, name: string, month: string): Promise<FormState> {
  await requireAdmin();
  const meta = await getMeta(slug);
  if (!meta) return { error: "Entrega não encontrada." };
  if (!name || name !== sanitizeFileName(name)) return { error: "Vídeo inválido." };
  if (month && !isMonth(month)) return { error: "Mês inválido." };
  const months = { ...meta.videoMonths };
  if (month) months[name] = month;
  else delete months[name];
  meta.videoMonths = months;
  await putMeta(meta);
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/entrega/${slug}`);
  return { ok: "Mês salvo." };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const category = String(formData.get("category") ?? "") as Category;
  if (!isValidSlug(slug) || !CATEGORIES.includes(category)) return;

  const files = await listGalleryFiles(slug);
  const keys = files[category].map((f) => f.key);
  // Miniaturas, versões web, favoritas e medidas só existem para fotos
  if (category === "photos") {
    keys.push(
      ...files.thumbs.map((f) => f.key),
      ...files.web.map((f) => f.key),
      ...files.favorites.map((f) => f.key),
      `${galleryPrefix(slug)}photos.json`
    );
  }
  if (category === "videos") {
    keys.push(...files.covers.filter((f) => f.name.startsWith("videos/")).map((f) => f.key));
  }
  if (keys.length) await deleteKeys(keys);
  if (category === "videos") await forgetVideoTitles(slug, files.videos.map((f) => f.name));
  revalidatePath(`/admin/${slug}`);
}

// Álbuns de fotos: cada um é uma pasta em photos/<id>/; o principal ("") fica na raiz
export async function createAlbum(slug: string, title: string): Promise<FormState & { id?: string }> {
  await requireAdmin();
  const meta = await getMeta(slug);
  if (!meta) return { error: "Entrega não encontrada." };
  const clean = title.trim().slice(0, 60);
  if (!clean) return { error: "Dê um nome ao álbum." };

  const albums = galleryAlbums(meta);
  const base = slugify(clean) || "album";
  let id = base;
  for (let n = 2; albums.some((a) => a.id === id); n++) id = `${base}-${n}`;
  meta.albums = [...albums, { id, title: clean }];
  await putMeta(meta);
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/entrega/${slug}`);
  return { ok: "Álbum criado.", id };
}

export async function renameAlbum(slug: string, id: string, title: string): Promise<FormState> {
  await requireAdmin();
  const meta = await getMeta(slug);
  if (!meta) return { error: "Entrega não encontrada." };
  const clean = title.trim().slice(0, 60);
  if (!clean) return { error: "Dê um nome ao álbum." };
  const albums = galleryAlbums(meta);
  const album = albums.find((a) => a.id === id);
  if (!album) return { error: "Álbum não encontrado." };
  album.title = clean;
  meta.albums = albums;
  await putMeta(meta);
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/entrega/${slug}`);
  return { ok: "Álbum renomeado." };
}

/** Apaga o álbum e todas as fotos dele (miniaturas e favoritas incluídas). */
export async function deleteAlbum(slug: string, id: string): Promise<FormState> {
  await requireAdmin();
  const meta = await getMeta(slug);
  if (!meta) return { error: "Entrega não encontrada." };
  if (!id) return { error: "O álbum principal não pode ser excluído; use Excluir tudo para esvaziá-lo." };

  const files = await listGalleryFiles(slug);
  const inAlbum = (name: string) => name.startsWith(`${id}/`);
  const keys = [files.photos, files.thumbs, files.web, files.favorites].flatMap((list) =>
    list.filter((f) => inAlbum(f.name)).map((f) => f.key)
  );
  if (keys.length) await deleteKeys(keys);
  meta.albums = galleryAlbums(meta).filter((a) => a.id !== id);
  await putMeta(meta);
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/entrega/${slug}`);
  return { ok: "Álbum excluído." };
}

/** Define a foto da capa; nome vazio volta para a capa automática. */
export async function setCover(slug: string, name: string): Promise<FormState> {
  await requireAdmin();
  const meta = await getMeta(slug);
  if (!meta) return { error: "Entrega não encontrada." };
  if (name && !isPhotoName(name)) return { error: "Foto inválida." };
  meta.cover = name || undefined;
  await putMeta(meta);
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/entrega/${slug}`);
  return { ok: name ? "Capa definida." : "Capa automática." };
}

/** Salva o enquadramento da capa em cada tela. */
export async function setCoverCrop(slug: string, crops: CoverCrops): Promise<FormState> {
  await requireAdmin();
  const meta = await getMeta(slug);
  if (!meta) return { error: "Entrega não encontrada." };
  const clean: CoverCrops = {};
  for (const screen of SCREENS) {
    const crop = normalizeCrop(crops?.[screen.id]);
    if (crop) clean[screen.id] = crop;
  }
  meta.coverCrop = clean;
  await putMeta(meta);
  revalidatePath(`/admin/${slug}`);
  revalidatePath("/admin");
  return { ok: "Enquadramento salvo." };
}

/** Apaga a capa geral (sem vídeo) ou a capa de um vídeo. */
export async function removeCover(slug: string, video = ""): Promise<FormState> {
  await requireAdmin();
  if (!isValidSlug(slug)) return { error: "Entrega não encontrada." };
  if (video && video !== sanitizeFileName(video)) return { error: "Vídeo inválido." };
  await deleteKeys([fileKey(slug, "covers", video ? videoCoverName(video) : GALLERY_COVER)]);
  revalidatePath(`/admin/${slug}`);
  return { ok: "Capa removida." };
}

/** Cria (ou troca) o código do link da entrega. O link anterior deixa de abrir. */
export async function renewGalleryLink(slug: string): Promise<FormState> {
  await requireAdmin();
  const meta = await getMeta(slug);
  if (!meta) return { error: "Entrega não encontrada." };
  meta.accessKey = newAccessKey();
  await putMeta(meta);
  revalidatePath(`/admin/${slug}`);
  return { ok: "Link novo criado." };
}

// Recados gerais deixados na entrega do cliente
export async function markFeedbackSeen(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const meta = await getMeta(slug);
  if (!meta) return;
  await putMeta({ ...meta, feedbackSeenAt: new Date().toISOString() });
  revalidatePath(`/admin/${slug}`);
  revalidatePath("/admin");
}

export async function deleteFeedback(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!(await getMeta(slug))) return;
  await removeFeedback(slug, String(formData.get("id") ?? ""));
  revalidatePath(`/admin/${slug}`);
  revalidatePath("/admin");
}
