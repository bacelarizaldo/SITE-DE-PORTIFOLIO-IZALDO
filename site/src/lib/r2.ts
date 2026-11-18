import "server-only";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { sanitizeFileName } from "./filename";
import type { CoverCrops } from "./coverCrop";

// Estrutura no bucket:
//   galleries/<slug>/meta.json
//   galleries/<slug>/videos/<arquivo>
//   galleries/<slug>/photos/<arquivo>          (álbum principal)
//   galleries/<slug>/photos/<álbum>/<arquivo>  (outros álbuns, ex.: bastidores)
//   galleries/<slug>/thumbs/<arquivo>.jpg   (miniatura ~640px, gerada no upload)
//   galleries/<slug>/web/<arquivo>.jpg      (versão ~2048px para o visualizador)
//   galleries/<slug>/downloads/<arquivo>    (ex.: fotos.zip)
//   galleries/<slug>/favorites/<foto>       (marcador vazio: foto favoritada pelo cliente)
//   galleries/<slug>/photos.json            (largura e altura de cada foto, para o mosaico)
//   galleries/<slug>/covers/capa.jpg        (capa geral enviada no admin; vale mais que as fotos)
//   galleries/<slug>/covers/videos/<vídeo>.jpg  (capa de cada vídeo, mostrada antes do play)
//   galleries/<slug>/feedback/<id>.json     (recado geral deixado pelo cliente)

export type Category = "videos" | "photos" | "downloads";
export const CATEGORIES: Category[] = ["videos", "photos", "downloads"];

export type Album = { id: string; title: string };

export type GalleryMeta = {
  slug: string;
  /** Código aleatório no fim do link (/entrega/<slug>-<código>); galerias antigas não têm */
  accessKey?: string;
  title: string;
  date?: string;
  /** Títulos escolhidos no admin, por nome do arquivo de vídeo */
  videoTitles?: Record<string, string>;
  /** Ordem dos vídeos escolhida no admin (nomes dos arquivos); os que faltam vêm depois, por nome */
  videoOrder?: string[];
  /** Mês de cada vídeo ("2026-11"), escolhido no admin; sem ele, o mês em que o vídeo foi enviado */
  videoMonths?: Record<string, string>;
  /** Álbuns de fotos, na ordem de exibição. O id "" é o álbum principal (fotos na raiz de photos/) */
  albums?: Album[];
  /** Foto escolhida para a capa (caminho relativo a photos/); sem ela, a capa é automática */
  cover?: string;
  /** Enquadramento da capa em cada tela (computador, tablet, celular); sem ele, centralizado */
  coverCrop?: CoverCrops;
  /** Última vez que o admin marcou os recados como lidos; os mais novos aparecem como "novo" */
  feedbackSeenAt?: string;
  createdAt: string;
};

export function galleryAlbums(meta: GalleryMeta): Album[] {
  return meta.albums?.length ? meta.albums : [{ id: "", title: "Fotos" }];
}

/** Nome de foto relativo a photos/: "arquivo.jpg" ou "<álbum>/arquivo.jpg" */
export function isPhotoName(name: string) {
  const parts = name.split("/");
  const file = parts[parts.length - 1];
  if (!file || file !== sanitizeFileName(file)) return false;
  return parts.length === 1 || (parts.length === 2 && isValidSlug(parts[0]));
}

export const albumOf = (name: string) => (name.includes("/") ? name.slice(0, name.indexOf("/")) : "");

/**
 * Foto da capa: a escolhida no admin ou, sem escolha (ou se ela foi excluída),
 * a primeira foto do primeiro álbum. names deve estar em ordem de nome.
 */
export function coverPhoto(meta: GalleryMeta, names: string[]) {
  if (meta.cover && names.includes(meta.cover)) return meta.cover;
  for (const album of galleryAlbums(meta)) {
    const first = names.find((n) => albumOf(n) === album.id);
    if (first) return first;
  }
  return names[0];
}

/** Vídeos na ordem escolhida no admin; os novos (fora da lista) vão para o fim, na ordem em que vieram */
export function sortVideos<T extends { name: string }>(meta: GalleryMeta, videos: T[]) {
  const order = new Map((meta.videoOrder ?? []).map((name, i) => [name, i]));
  const rank = (v: T) => order.get(v.name) ?? Infinity;
  return [...videos].sort((a, b) => rank(a) - rank(b));
}

export const isMonth = (month: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

/** Mês de um vídeo: o escolhido no admin ou o do envio (no horário do estúdio) */
export function videoMonth(meta: GalleryMeta, file: { name: string; lastModified?: string }) {
  const chosen = meta.videoMonths?.[file.name];
  if (chosen && isMonth(chosen)) return chosen;
  if (!file.lastModified) return undefined;
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "America/Recife" }).formatToParts(new Date(file.lastModified));
  const y = parts.find((x) => x.type === "year")?.value;
  const m = parts.find((x) => x.type === "month")?.value;
  return y && m ? `${y}-${m}` : undefined;
}

/** Capa geral enviada no admin, relativa a covers/ */
export const GALLERY_COVER = "capa.jpg";
/** Capa de um vídeo, relativa a covers/ */
export const videoCoverName = (video: string) => `videos/${video}.jpg`;

export type StoredFile = {
  key: string;
  name: string;
  size: number;
  lastModified?: string;
};

const ROOT = "galleries";

export function isConfigured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.SESSION_SECRET &&
      process.env.ADMIN_PASSWORD
  );
}

let client: S3Client | null = null;
function s3() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      // R2_ENDPOINT só para testes locais com um emulador de S3
      endpoint:
        process.env.R2_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      forcePathStyle: Boolean(process.env.R2_ENDPOINT),
      // Recomendação da Cloudflare: sem checksums automáticos nas URLs assinadas
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

const bucket = () => process.env.R2_BUCKET!;

export const galleryPrefix = (slug: string) => `${ROOT}/${slug}/`;
export const fileKey = (slug: string, dir: string, name: string) =>
  `${ROOT}/${slug}/${dir}/${name}`;

export function isValidSlug(slug: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug);
}

export { sanitizeFileName };

/** Garante que a chave pertence à galeria e a uma categoria conhecida. */
export function assertKeyInGallery(slug: string, key: string) {
  const prefix = galleryPrefix(slug);
  if (!key.startsWith(prefix) || key.includes("..")) throw new Error("Chave inválida");
  const dir = key.slice(prefix.length).split("/")[0];
  if (![...CATEGORIES, "thumbs", "web"].includes(dir)) throw new Error("Chave inválida");
}

export async function getMeta(slug: string): Promise<GalleryMeta | null> {
  if (!isValidSlug(slug)) return null;
  try {
    const res = await s3().send(
      new GetObjectCommand({ Bucket: bucket(), Key: `${galleryPrefix(slug)}meta.json` })
    );
    return JSON.parse(await res.Body!.transformToString());
  } catch (err: unknown) {
    if ((err as { name?: string }).name === "NoSuchKey") return null;
    throw err;
  }
}

/** Lê um arquivo inteiro do bucket (para imagens pequenas, como a capa da prévia do link) */
export async function readObject(key: string): Promise<Uint8Array | null> {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    return await res.Body!.transformToByteArray();
  } catch (err: unknown) {
    if ((err as { name?: string }).name === "NoSuchKey") return null;
    throw err;
  }
}

export async function putMeta(meta: GalleryMeta) {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: `${galleryPrefix(meta.slug)}meta.json`,
      Body: JSON.stringify(meta),
      ContentType: "application/json",
    })
  );
}

async function listAll(prefix: string, delimiter?: string) {
  const objects: StoredFile[] = [];
  const prefixes: string[] = [];
  let token: string | undefined;
  do {
    const res = await s3().send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: prefix,
        Delimiter: delimiter,
        ContinuationToken: token,
      })
    );
    for (const o of res.Contents ?? []) {
      objects.push({
        key: o.Key!,
        name: o.Key!.slice(o.Key!.lastIndexOf("/") + 1),
        size: o.Size ?? 0,
        lastModified: o.LastModified?.toISOString(),
      });
    }
    for (const p of res.CommonPrefixes ?? []) prefixes.push(p.Prefix!);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return { objects, prefixes };
}

export async function listGalleries(): Promise<GalleryMeta[]> {
  const { prefixes } = await listAll(`${ROOT}/`, "/");
  const metas = await Promise.all(
    prefixes.map((p) => getMeta(p.slice(ROOT.length + 1, -1)))
  );
  return metas
    .filter((m): m is GalleryMeta => Boolean(m))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type GalleryFiles = Record<Category | "thumbs" | "web" | "favorites" | "covers" | "feedback", StoredFile[]>;

export async function listGalleryFiles(slug: string): Promise<GalleryFiles> {
  const { objects } = await listAll(galleryPrefix(slug));
  const out: GalleryFiles = { videos: [], photos: [], downloads: [], thumbs: [], web: [], favorites: [], covers: [], feedback: [] };
  const prefix = galleryPrefix(slug);
  for (const o of objects) {
    const path = o.key.slice(prefix.length);
    const dir = path.split("/")[0] as keyof GalleryFiles;
    // Nome relativo à pasta, para fotos de outros álbuns virem como "<álbum>/arquivo.jpg"
    if (dir in out) out[dir].push({ ...o, name: path.slice(dir.length + 1) });
  }
  for (const list of Object.values(out)) {
    list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
  }
  return out;
}

export type PhotoDims = Record<string, [number, number]>;

const dimsKey = (slug: string) => `${galleryPrefix(slug)}photos.json`;

export async function getPhotoDims(slug: string): Promise<PhotoDims> {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: dimsKey(slug) }));
    return JSON.parse(await res.Body!.transformToString());
  } catch (err: unknown) {
    if ((err as { name?: string }).name === "NoSuchKey") return {};
    throw err;
  }
}

/** Junta as novas medidas às já salvas. Só o admin escreve aqui. */
export async function addPhotoDims(slug: string, dims: PhotoDims) {
  const merged = { ...(await getPhotoDims(slug)), ...dims };
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: dimsKey(slug),
      Body: JSON.stringify(merged),
      ContentType: "application/json",
    })
  );
}

// Link da galeria: o nome do projeto sozinho é fácil de adivinhar, então o link leva um código
// aleatório no fim. Galerias criadas antes do código abrem pelo nome até o admin gerar um.
const KEY_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

export function newAccessKey() {
  return Array.from(randomBytes(8), (b) => KEY_CHARS[b % KEY_CHARS.length]).join("");
}

export const galleryPath = (meta: GalleryMeta) =>
  `/entrega/${meta.accessKey ? `${meta.slug}-${meta.accessKey}` : meta.slug}`;

/** Acha a galeria pelo final do link; com código, só abre com o código certo. */
export async function getGalleryByLink(link: string): Promise<GalleryMeta | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(link)) return null;
  const cut = link.lastIndexOf("-");
  if (cut > 0) {
    const meta = await getMeta(link.slice(0, cut));
    const key = Buffer.from(link.slice(cut + 1));
    if (meta?.accessKey) {
      const expected = Buffer.from(meta.accessKey);
      if (expected.length === key.length && timingSafeEqual(expected, key)) return meta;
    }
  }
  const legacy = await getMeta(link);
  return legacy && !legacy.accessKey ? legacy : null;
}

export async function setFavoriteMarker(slug: string, name: string, favorite: boolean) {
  const key = fileKey(slug, "favorites", name);
  if (favorite) {
    await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: "" }));
  } else {
    await deleteKeys([key]);
  }
}

// Recados gerais da galeria. Um arquivo por recado: dois envios ao mesmo tempo não se sobrescrevem.
export type Feedback = { id: string; name?: string; message: string; createdAt: string };

export const FEEDBACK_LIMITS = { name: 80, message: 2000, perGallery: 300 };
const FEEDBACK_ID = /^\d{13}-[a-z0-9]{6}$/;
const feedbackKey = (slug: string, id: string) => `${galleryPrefix(slug)}feedback/${id}.json`;

export async function addFeedback(slug: string, entry: { name?: string; message: string }) {
  const { objects } = await listAll(`${galleryPrefix(slug)}feedback/`);
  if (objects.length >= FEEDBACK_LIMITS.perGallery) throw new Error("Limite de recados desta galeria atingido");
  const id = `${Date.now()}-${Array.from(randomBytes(6), (b) => KEY_CHARS[b % KEY_CHARS.length]).join("")}`;
  const feedback: Feedback = { id, message: entry.message, createdAt: new Date().toISOString() };
  if (entry.name) feedback.name = entry.name;
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: feedbackKey(slug, id),
      Body: JSON.stringify(feedback),
      ContentType: "application/json",
    })
  );
  return feedback;
}

/** Recados da galeria, do mais novo para o mais antigo */
export async function listFeedback(slug: string): Promise<Feedback[]> {
  const { objects } = await listAll(`${galleryPrefix(slug)}feedback/`);
  const items = await Promise.all(
    objects.map(async (o) => {
      try {
        const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: o.key }));
        return JSON.parse(await res.Body!.transformToString()) as Feedback;
      } catch {
        return null;
      }
    })
  );
  return items.filter((f): f is Feedback => Boolean(f)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteFeedback(slug: string, id: string) {
  if (!FEEDBACK_ID.test(id)) throw new Error("Recado inválido");
  await deleteKeys([feedbackKey(slug, id)]);
}

/** Quantos recados chegaram depois da última leitura (pela data dos arquivos, sem abrir cada um) */
export function unreadFeedback(meta: GalleryMeta, feedback: StoredFile[]) {
  const seen = meta.feedbackSeenAt ?? "";
  return feedback.filter((f) => (f.lastModified ?? "") > seen).length;
}

export async function deleteKeys(keys: string[]) {
  for (let i = 0; i < keys.length; i += 1000) {
    await s3().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })) },
      })
    );
  }
}

export async function deleteGallery(slug: string) {
  const { objects } = await listAll(galleryPrefix(slug));
  if (objects.length) await deleteKeys(objects.map((o) => o.key));
}

const URL_TTL = 60 * 60 * 12; // 12 horas

// Os arquivos originais são gravados com Content-Disposition: attachment, então abrir o
// link baixa o arquivo, enquanto <video> e <img> continuam exibindo normalmente.
export const attachment = (name: string) => `attachment; filename="${name.replace(/"/g, "")}"`;

export function signGet(key: string, version?: string, downloadName?: string) {
  // Assinatura fixa dentro de cada hora: o link não muda a cada carregamento,
  // então o navegador reaproveita as imagens que já baixou.
  const hour = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000);
  // A capa é regravada com o mesmo nome; a versão (data da gravação) entra no link assinado,
  // senão o navegador seguiria mostrando a imagem antiga guardada no cache
  const ResponseContentDisposition = downloadName
    ? attachment(downloadName)
    : version
      ? `inline; filename="v${version.replace(/\D/g, "")}.jpg"`
      : undefined;
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition }), {
    expiresIn: URL_TTL + 3600,
    signingDate: hour,
  });
}

/** Link de uma capa: muda sempre que a capa é trocada */
export function signCover(files: StoredFile[], name: string) {
  const file = files.find((f) => f.name === name);
  return file ? signGet(file.key, file.lastModified) : undefined;
}

/** Link para baixar uma capa (salva como arquivo, com um nome legível) */
export function signCoverDownload(files: StoredFile[], name: string, label: string) {
  const file = files.find((f) => f.name === name);
  if (!file) return undefined;
  // Só letras sem acento no nome do arquivo: o nome vai num cabeçalho da resposta
  const safe = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s.&()-]/g, "").trim() || "capa";
  return signGet(file.key, file.lastModified, `Capa - ${safe}.jpg`);
}

export function signPut(key: string, contentType: string, disposition?: string) {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: contentType,
      ContentDisposition: disposition,
    }),
    { expiresIn: 60 * 60 }
  );
}

export async function createMultipart(key: string, contentType: string, disposition?: string) {
  const res = await s3().send(
    new CreateMultipartUploadCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: contentType,
      ContentDisposition: disposition,
    })
  );
  return res.UploadId!;
}

export function signPart(key: string, uploadId: string, partNumber: number) {
  return getSignedUrl(
    s3(),
    new UploadPartCommand({
      Bucket: bucket(),
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    // As URLs de todas as partes são geradas no início; 24 h cobre uploads longos
    { expiresIn: 60 * 60 * 24 }
  );
}

export async function completeMultipart(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
) {
  await s3().send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) },
    })
  );
}

export async function abortMultipart(key: string, uploadId: string) {
  await s3().send(
    new AbortMultipartUploadCommand({ Bucket: bucket(), Key: key, UploadId: uploadId })
  );
}
