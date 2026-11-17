import { sanitizeFileName } from "./filename";

export type UploadCategory = "videos" | "photos" | "downloads";

const MB = 1024 ** 2;
const GB = 1024 ** 3;

// Limites por arquivo. O R2 aceita até 10.000 partes de 32 MB (cerca de 312 GB),
// então os limites de vídeo e download servem para pegar arquivo errado, não o R2.
export const MAX_SIZE: Record<UploadCategory, number> = {
  photos: 100 * MB,
  videos: 50 * GB,
  downloads: 50 * GB,
};

const PHOTO_EXT = ["jpg", "jpeg", "png", "webp", "heic", "heif", "tif", "tiff", "dng", "cr2", "cr3", "nef", "arw", "raf", "orf", "rw2"];
const VIDEO_EXT = ["mp4", "mov", "m4v", "webm", "mkv", "avi"];

const extOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
};

export function formatLimit(bytes: number) {
  return bytes >= GB ? `${Math.round(bytes / GB)} GB` : `${Math.round(bytes / MB)} MB`;
}

/** Motivo para recusar o arquivo antes de enviar, ou null se ele pode subir. */
export function rejectReason(file: File, category: UploadCategory): string | null {
  // Arquivos ocultos do sistema (.DS_Store, ._foto.jpg) vêm junto quando se arrasta uma pasta
  if (file.name.startsWith(".")) return "arquivo oculto do sistema";
  if (file.size === 0) return "arquivo vazio (ou é uma pasta)";
  const ext = extOf(file.name);
  if (category === "photos" && !file.type.startsWith("image/") && !PHOTO_EXT.includes(ext)) {
    return "não é uma foto (use JPG, PNG, HEIC ou RAW)";
  }
  if (category === "videos" && !file.type.startsWith("video/") && !VIDEO_EXT.includes(ext)) {
    return "não é um vídeo (use MP4 ou MOV)";
  }
  if (file.size > MAX_SIZE[category]) {
    return `maior que o limite de ${formatLimit(MAX_SIZE[category])}`;
  }
  return null;
}

/** Nome com que o arquivo fica no R2 (o servidor aplica a mesma limpeza). */
export const storedName = (file: File) => sanitizeFileName(file.name);

/** Próximo nome livre: foto.jpg → foto-2.jpg, foto-3.jpg... */
export function freeName(name: string, taken: Set<string>) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    // O servidor corta o nome em 120 caracteres; o sufixo não pode ser cortado
    const candidate = `${base.slice(0, 120 - suffix.length)}${suffix}${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
}
