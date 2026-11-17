"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_SIZE, formatLimit, freeName, rejectReason, storedName } from "@/lib/uploadRules";

type Category = "videos" | "photos" | "downloads";
type Status = "fila" | "enviando" | "ok" | "erro" | "cancelado";
type Item = {
  id: string;
  file: File;
  /** Nome com que o arquivo fica no R2 (pode ser diferente do original, ex.: foto-2.jpg) */
  name: string;
  /** Substitui um arquivo que já existe com o mesmo nome */
  replace?: boolean;
  status: Status;
  error?: string;
  resume: Resumable;
};
type Rejected = { name: string; reason: string };
type DuplicateAction = "ignore" | "replace" | "rename";
/** Envio parado esperando o admin decidir o que fazer com os arquivos repetidos */
type PendingBatch = { files: { file: File; name: string }[]; duplicates: string[] };
type Signed = { url: string; headers: Record<string, string> };

const PART_SIZE = 32 * 1024 * 1024; // 32 MB por parte
const MULTIPART_FROM = 64 * 1024 * 1024;
const PART_CONCURRENCY = 6; // conexões simultâneas por vídeo
const PHOTO_CONCURRENCY = 6; // fotos enviadas ao mesmo tempo
const DECODE_CONCURRENCY = 2; // fotos abertas ao mesmo tempo para gerar miniaturas (memória)
const SIGN_BATCH = 500;

const ACCEPT: Record<Category, string> = {
  videos: "video/*",
  photos: "image/*",
  downloads: "",
};

export async function api(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Falha no upload");
  return data;
}

const cancelled = () => new DOMException("Cancelado", "AbortError");

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(cancelled());
      },
      { once: true }
    );
  });
}

function put(
  url: string,
  blob: Blob,
  headers: Record<string, string>,
  onProgress: (loaded: number) => void,
  signal?: AbortSignal
) {
  return new Promise<string>((resolve, reject) => {
    if (signal?.aborted) return reject(cancelled());
    const xhr = new XMLHttpRequest();
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.onabort = () => reject(cancelled());
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () =>
      xhr.status < 300
        ? resolve(xhr.getResponseHeader("ETag") ?? "")
        : reject(new Error(`R2 respondeu ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Erro de rede (verifique a internet ou o CORS do bucket)"));
    xhr.send(blob);
  });
}

// Sem internet, espera ela voltar (sem gastar tentativas)
function online(signal?: AbortSignal) {
  if (navigator.onLine) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      window.removeEventListener("online", done);
      if (signal?.aborted) reject(cancelled());
      else resolve();
    };
    window.addEventListener("online", done);
    signal?.addEventListener("abort", done, { once: true });
  });
}

// Tenta de novo quando a conexão oscila, esperando 2 s, 4 s, 8 s... (no máximo 30 s entre tentativas)
export async function putWithRetry(
  url: string,
  blob: Blob,
  headers: Record<string, string>,
  onProgress: (loaded: number) => void,
  signal?: AbortSignal,
  attempts = 5
) {
  for (let attempt = 1; ; attempt++) {
    try {
      await online(signal);
      return await put(url, blob, headers, onProgress, signal);
    } catch (err) {
      onProgress(0);
      if (signal?.aborted || attempt >= attempts) throw err;
      await sleep(Math.min(30_000, 1000 * 2 ** attempt), signal);
    }
  }
}

// "Erro de rede" também aparece quando o navegador perde o acesso ao arquivo
// (HD externo desconectado, pasta da nuvem que ainda não baixou o arquivo).
async function explain(err: unknown, file: File) {
  if (err instanceof DOMException && err.name === "AbortError") return err;
  try {
    await file.slice(file.size - 1).arrayBuffer();
  } catch {
    return new Error(
      "O navegador não conseguiu ler o arquivo. Se ele está num HD externo ou numa pasta da nuvem, copie para o computador e envie de novo."
    );
  }
  return err;
}

function limiter(max: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async <T,>(task: () => Promise<T>) => {
    if (active >= max) await new Promise<void>((r) => waiting.push(r));
    active++;
    try {
      return await task();
    } finally {
      active--;
      waiting.shift()?.();
    }
  };
}
const decodeSlot = limiter(DECODE_CONCURRENCY);

export function scaled(source: CanvasImageSource & { width: number; height: number }, maxSize: number) {
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export const toJpeg = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar miniatura"))), "image/jpeg", quality)
  );

// Abre a foto uma única vez: gera a versão web (2048 px) e a miniatura sai dela.
function makeDerivatives(file: File) {
  return decodeSlot(async () => {
    const bitmap = await createImageBitmap(file);
    const web = scaled(bitmap, 2048);
    bitmap.close();
    const thumb = scaled(web, 720);
    const [webBlob, thumbBlob] = await Promise.all([toJpeg(web, 0.86), toJpeg(thumb, 0.8)]);
    return { web: webBlob, thumb: thumbBlob, dims: [web.width, web.height] as [number, number] };
  });
}

type Uploaded = { name: string; dims: [number, number] } | undefined;

async function uploadPhoto(
  slug: string,
  item: Item,
  onLoaded: (bytes: number) => void,
  signal: AbortSignal,
  album: string
): Promise<Uploaded> {
  const { file } = item;
  const signed: { name: string; original: Signed; thumb: Signed; web: Signed } = await api({
    op: "photo",
    slug,
    album,
    fileName: item.name,
    contentType: file.type || "image/jpeg",
    size: file.size,
    replace: Boolean(item.replace),
  });
  // Miniaturas são geradas enquanto o original sobe.
  // Formato que o navegador não lê (ex.: HEIC): a entrega usa o arquivo original.
  const derivatives = makeDerivatives(file).catch(() => null);
  await putWithRetry(signed.original.url, file, signed.original.headers, onLoaded, signal);
  // Com o original já no R2, a foto termina mesmo se o envio for cancelado agora:
  // as miniaturas são pequenas e a foto não fica pela metade na entrega.
  const derived = await derivatives;
  if (!derived) return;
  await Promise.all([
    putWithRetry(signed.web.url, derived.web, signed.web.headers, () => {}),
    putWithRetry(signed.thumb.url, derived.thumb, signed.thumb.headers, () => {}),
  ]);
  return { name: signed.name, dims: derived.dims };
}

/** Envio em partes que pode ser retomado: guarda as partes que já subiram. */
export type Resumable = { key?: string; uploadId?: string; etags: Map<number, string> };

async function uploadMultipart(
  slug: string,
  category: Category,
  item: Item,
  onLoaded: (bytes: number) => void,
  signal: AbortSignal,
  album: string
) {
  const { file, resume: state } = item;
  if (!state.key || !state.uploadId) {
    const contentType = file.type || "application/octet-stream";
    const created = await api({
      op: "create",
      slug,
      category,
      album,
      fileName: item.name,
      contentType,
      size: file.size,
      replace: Boolean(item.replace),
    });
    state.key = created.key;
    state.uploadId = created.uploadId;
  }
  const { key, uploadId, etags } = state;
  const total = Math.ceil(file.size / PART_SIZE);
  const partSize = (index: number) => Math.min(PART_SIZE, file.size - index * PART_SIZE);

  try {
    // Só as partes que faltam; as URLs são assinadas de novo a cada tentativa, então nunca vencem
    const missing = Array.from({ length: total }, (_, i) => i).filter((i) => !etags.has(i + 1));
    const batches = [];
    for (let i = 0; i < missing.length; i += SIGN_BATCH) batches.push(missing.slice(i, i + SIGN_BATCH));
    const signed = await Promise.all(
      batches.map((b) => api({ op: "part", slug, key, uploadId, partNumbers: b.map((i) => i + 1) }))
    );
    const urls = new Map<number, string>();
    batches.forEach((b, n) => b.forEach((index, j) => urls.set(index, signed[n].urls[j])));

    const loaded = Array.from({ length: total }, (_, i) => (etags.has(i + 1) ? partSize(i) : 0));
    onLoaded(loaded.reduce((a, b) => a + b, 0));
    let next = 0;
    const worker = async () => {
      while (next < missing.length) {
        if (signal.aborted) throw cancelled();
        const index = missing[next++];
        const blob = file.slice(index * PART_SIZE, (index + 1) * PART_SIZE);
        const etag = await putWithRetry(
          urls.get(index)!,
          blob,
          {},
          (l) => {
            loaded[index] = l;
            onLoaded(loaded.reduce((a, b) => a + b, 0));
          },
          signal,
          8
        );
        if (!etag) throw new Error("ETag ausente (exponha o header ETag no CORS do bucket)");
        etags.set(index + 1, etag);
      }
    };
    await Promise.all(Array.from({ length: Math.min(PART_CONCURRENCY, missing.length) }, worker));
    const parts = [...etags].map(([PartNumber, ETag]) => ({ PartNumber, ETag }));
    await api({ op: "complete", slug, key, uploadId, parts });
  } catch (err) {
    // Cancelado: apaga do R2 as partes que já tinham subido.
    // Erro: as partes ficam, para o "Tentar de novo" continuar de onde parou.
    if (signal.aborted) await api({ op: "abort", slug, key, uploadId }).catch(() => {});
    throw await explain(err, file);
  }
}

async function uploadFile(
  slug: string,
  category: Category,
  item: Item,
  onLoaded: (bytes: number) => void,
  signal: AbortSignal,
  album: string
): Promise<Uploaded> {
  const { file } = item;
  if (file.size >= MULTIPART_FROM) {
    await uploadMultipart(slug, category, item, onLoaded, signal, album);
    return;
  }
  if (category === "photos") return uploadPhoto(slug, item, onLoaded, signal, album);
  const contentType = file.type || "application/octet-stream";
  const res = await api({
    op: "put",
    slug,
    category,
    fileName: item.name,
    contentType,
    size: file.size,
    replace: Boolean(item.replace),
  });
  await putWithRetry(res.url, file, res.headers, onLoaded, signal).catch(async (err) => {
    throw await explain(err, file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024 ** 3) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1).replace(".", ",")} GB`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "calculando...";
  if (seconds < 60) return "menos de 1 min";
  const min = Math.round(seconds / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

export default function Uploader({
  slug,
  category,
  label,
  album = "",
  existing = [],
  handle,
  bare = false,
}: {
  slug: string;
  category: Category;
  label: string;
  /** Recebe a função de envio, para outro componente mandar arquivos para cá (ex.: "Enviar mídias") */
  handle?: (start: (files: File[]) => void) => void;
  /**
   * Sem o botão próprio nem o "soltar na seção": quem usa decide de onde vêm os arquivos.
   * Os avisos (repetidos, recusados) e o progresso continuam aparecendo aqui.
   */
  bare?: boolean;
  /** Álbum de destino das fotos ("" = álbum principal) */
  album?: string;
  /** Nomes dos arquivos que já estão no destino (sem a pasta do álbum), para avisar sobre repetidos */
  existing?: string[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [rejected, setRejected] = useState<Rejected[]>([]);
  const [pendingBatch, setPendingBatch] = useState<PendingBatch | null>(null);
  const [dragging, setDragging] = useState(false);
  // Progresso fica fora do state e a tela é atualizada 3x por segundo,
  // para não redesenhar a lista a cada byte enviado.
  const loadedRef = useRef(new Map<string, number>());
  const samplesRef = useRef<{ t: number; bytes: number }[]>([]);
  const controllersRef = useRef(new Map<string, AbortController>());
  // Medidas das fotos enviadas, salvas em lotes e uma requisição por vez
  const dimsRef = useRef<Record<string, [number, number]>>({});
  const dimsChainRef = useRef(Promise.resolve());

  function flushDims() {
    const dims = dimsRef.current;
    dimsRef.current = {};
    if (!Object.keys(dims).length) return dimsChainRef.current;
    dimsChainRef.current = dimsChainRef.current.then(() => api({ op: "dims", slug, dims }).catch(() => {}));
    return dimsChainRef.current;
  }
  // Cópia do progresso para desenhar a tela: o envio escreve nas refs a cada byte,
  // e a tela só lê esta cópia, atualizada 3 vezes por segundo
  type Progress = { loaded: Map<string, number>; samples: { t: number; bytes: number }[] };
  const [progress, setProgress] = useState<Progress>({ loaded: new Map(), samples: [] });
  const busy = items.some((i) => i.status === "fila" || i.status === "enviando");

  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    const timer = setInterval(() => {
      const bytes = [...loadedRef.current.values()].reduce((a, b) => a + b, 0);
      const now = Date.now();
      samplesRef.current = [...samplesRef.current.filter((s) => now - s.t < 8000), { t: now, bytes }];
      setProgress({ loaded: new Map(loadedRef.current), samples: samplesRef.current });
    }, 333);
    return () => {
      window.removeEventListener("beforeunload", warn);
      clearInterval(timer);
    };
  }, [busy]);

  // Mantém a tela ligada durante o envio: com a tela apagada, o computador ou o celular
  // pode suspender a aba e o envio para no meio. O navegador solta a trava quando a aba
  // fica em segundo plano, então ela é pedida de novo quando a aba volta.
  useEffect(() => {
    if (!busy || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let stopped = false;
    const acquire = async () => {
      if (document.visibilityState !== "visible" || (lock && !lock.released)) return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (stopped) next.release();
        else lock = next;
      } catch {
        // Recusado (ex.: modo de economia de bateria): o envio segue sem a trava
      }
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", acquire);
      lock?.release().catch(() => {});
    };
  }, [busy]);

  // Soltar arquivos em qualquer ponto da seção (o card inteiro vira a área de envio).
  // Elementos com data-own-drop (ex.: capa de um vídeo) tratam o próprio arquivo.
  const rootRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<(files: File[]) => void>(() => {});
  useEffect(() => {
    const zone = bare ? null : rootRef.current?.closest("section");
    // Seção que trata o soltar por conta própria (ex.: a grade de mídias, que separa fotos e vídeos)
    if (!zone || zone.hasAttribute("data-drop-router")) return;
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const own = (e: DragEvent) => (e.target as Element | null)?.closest?.("[data-own-drop]");
    const set = (on: boolean) => {
      setDragging(on);
      if (on) zone.setAttribute("data-drop", "");
      else zone.removeAttribute("data-drop");
    };
    const enter = (e: DragEvent) => {
      if (!hasFiles(e) || own(e)) return;
      depth++;
      set(true);
    };
    const over = (e: DragEvent) => {
      if (!hasFiles(e) || own(e)) return;
      e.preventDefault();
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e) || own(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) set(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e) || own(e)) return;
      e.preventDefault();
      depth = 0;
      set(false);
      startRef.current(Array.from(e.dataTransfer?.files ?? []));
    };
    zone.addEventListener("dragenter", enter);
    zone.addEventListener("dragover", over);
    zone.addEventListener("dragleave", leave);
    zone.addEventListener("drop", drop);
    return () => {
      zone.removeEventListener("dragenter", enter);
      zone.removeEventListener("dragover", over);
      zone.removeEventListener("dragleave", leave);
      zone.removeEventListener("drop", drop);
      zone.removeAttribute("data-drop");
    };
  }, [bare]);

  const update = (id: string, patch: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  async function enqueue(files: { file: File; name: string; replace?: boolean }[]) {
    if (!files.length) return;
    const queue: Item[] = files.map(({ file, name, replace }) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      file,
      name,
      replace,
      status: "fila",
      resume: { etags: new Map() },
    }));
    for (const item of queue) controllersRef.current.set(item.id, new AbortController());
    setItems((list) => {
      const kept = list.filter((i) => i.status !== "ok" && i.status !== "cancelado");
      if (kept.length === 0) {
        loadedRef.current.clear();
        samplesRef.current = [];
      }
      return [...kept, ...queue];
    });
    await run(queue);
  }

  // Volta a enviar o que deu erro; vídeos grandes continuam das partes que já tinham subido
  async function retry(item: Item) {
    controllersRef.current.set(item.id, new AbortController());
    update(item.id, { status: "fila", error: undefined });
    await run([item]);
  }

  async function run(queue: Item[]) {
    const concurrency = category === "photos" ? PHOTO_CONCURRENCY : 1;
    let index = 0;
    const worker = async () => {
      while (index < queue.length) {
        const item = queue[index++];
        const { signal } = controllersRef.current.get(item.id)!;
        if (signal.aborted) continue;
        update(item.id, { status: "enviando" });
        try {
          const uploaded = await uploadFile(
            slug,
            category,
            item,
            (bytes) => loadedRef.current.set(item.id, bytes),
            signal,
            album
          );
          if (uploaded) {
            dimsRef.current[uploaded.name] = uploaded.dims;
            if (Object.keys(dimsRef.current).length >= 20) flushDims();
          }
          loadedRef.current.set(item.id, item.file.size);
          update(item.id, { status: "ok" });
        } catch (err) {
          loadedRef.current.set(item.id, 0);
          update(
            item.id,
            signal.aborted ? { status: "cancelado" } : { status: "erro", error: (err as Error).message }
          );
        } finally {
          controllersRef.current.delete(item.id);
        }
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
    await flushDims();
    router.refresh();
  }

  // Confere os arquivos antes de enviar: recusa os que não servem e,
  // se algum já existe com o mesmo nome, espera o admin decidir.
  function start(files: File[]) {
    if (!files.length || pendingBatch) return;
    const accepted: { file: File; name: string }[] = [];
    const refused: Rejected[] = [];
    for (const file of files) {
      const reason = rejectReason(file, category);
      if (reason) refused.push({ name: file.name, reason });
      else accepted.push({ file, name: storedName(file) });
    }
    setRejected(refused);
    if (!accepted.length) return;

    // Já no destino, ou na fila deste envio (a lista do servidor só atualiza no fim)
    const taken = new Set([
      ...existing,
      ...items.filter((i) => i.status !== "erro" && i.status !== "cancelado").map((i) => i.name),
    ]);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const { name } of accepted) {
      if ((taken.has(name) || seen.has(name)) && !duplicates.includes(name)) duplicates.push(name);
      seen.add(name);
    }
    if (duplicates.length) {
      setPendingBatch({ files: accepted, duplicates });
      return;
    }
    enqueue(accepted.map((a) => ({ ...a })));
  }

  function resolveDuplicates(action: DuplicateAction) {
    const batch = pendingBatch;
    setPendingBatch(null);
    if (!batch) return;
    const taken = new Set([
      ...existing,
      ...items.filter((i) => i.status !== "erro" && i.status !== "cancelado").map((i) => i.name),
    ]);
    const chosen: { file: File; name: string; replace?: boolean }[] = [];
    if (action === "replace") {
      // Dois arquivos com o mesmo nome no mesmo envio: fica o último
      const last = new Map<string, File>();
      for (const { file, name } of batch.files) last.set(name, file);
      for (const [name, file] of last) chosen.push({ file, name, replace: taken.has(name) });
    } else {
      const used = new Set(taken);
      for (const { file, name } of batch.files) {
        // Repetido e "ignorar": fica de fora. Repetido e "renomear": ganha o próximo nome livre.
        const finalName = !used.has(name) ? name : action === "rename" ? freeName(name, used) : null;
        if (!finalName) continue;
        chosen.push({ file, name: finalName });
        used.add(finalName);
      }
    }
    enqueue(chosen);
  }

  // Mantém o "soltar na seção" chamando a versão atual de start (ela muda a cada render)
  useEffect(() => {
    startRef.current = start;
  });
  useEffect(() => {
    handle?.((files) => startRef.current(files));
  }, [handle]);

  function cancel(ids: string[]) {
    for (const id of ids) controllersRef.current.get(id)?.abort();
    // Os que ainda estavam na fila nem começam; os que estavam subindo são interrompidos
    setItems((list) =>
      list.map((i) =>
        ids.includes(i.id) && (i.status === "fila" || i.status === "enviando") ? { ...i, status: "cancelado" } : i
      )
    );
    for (const id of ids) loadedRef.current.set(id, 0);
  }

  const done = items.filter((i) => i.status === "ok").length;
  const pending = items.filter((i) => i.status !== "erro" && i.status !== "cancelado");
  const active = items.filter((i) => i.status === "fila" || i.status === "enviando");
  const totalBytes = pending.reduce((a, i) => a + i.file.size, 0);
  const sentBytes = pending.reduce((a, i) => a + (progress.loaded.get(i.id) ?? 0), 0);
  const samples = progress.samples;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const speed = first && last && last.t > first.t ? ((last.bytes - first.bytes) / (last.t - first.t)) * 1000 : 0;
  const eta = speed > 0 ? (totalBytes - sentBytes) / speed : Infinity;
  const progressOf = (i: Item) =>
    i.status === "ok" ? 1 : Math.min(1, (progress.loaded.get(i.id) ?? 0) / Math.max(1, i.file.size));
  // Com muitas fotos, mostra só as que estão subindo e as com erro
  const visible = items.length > 30 ? items.filter((i) => i.status === "enviando" || i.status === "erro") : items;

  return (
    <div ref={rootRef}>
      <div className={bare ? "hidden" : "flex flex-wrap items-center gap-x-4 gap-y-2"}>
        <button
          type="button"
          disabled={Boolean(pendingBatch)}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-adm-ink px-5 text-sm font-semibold text-white transition hover:bg-adm-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ink disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
            <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
          </svg>
          {label}
        </button>
        <p className="text-sm text-adm-muted" aria-live="polite">
          {pendingBatch
            ? "Responda o aviso abaixo para continuar"
            : dragging
              ? "Solte para enviar"
              : `ou arraste para esta área · até ${formatLimit(MAX_SIZE[category])} por arquivo`}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT[category] || undefined}
          className="hidden"
          onChange={(e) => {
            start(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {pendingBatch && (
        <div role="alertdialog" aria-labelledby={`dup-${category}-${album}`} className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p id={`dup-${category}-${album}`} className="font-medium text-adm-ink">
            {pendingBatch.duplicates.length === 1
              ? "1 arquivo tem o mesmo nome de outro que já está aqui"
              : `${pendingBatch.duplicates.length} arquivos têm o mesmo nome de outros que já estão aqui`}
          </p>
          <p className="mt-1 break-words text-xs text-adm-muted">
            {pendingBatch.duplicates.slice(0, 5).join(", ")}
            {pendingBatch.duplicates.length > 5 && ` e mais ${pendingBatch.duplicates.length - 5}`}
          </p>
          <p className="mt-2 text-xs text-adm-ink-2">
            {pendingBatch.files.length > pendingBatch.duplicates.length && "Os outros arquivos sobem normalmente. "}
            O que fazer com os repetidos?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => resolveDuplicates("ignore")}
              className="rounded-lg bg-adm-ink px-3 py-1.5 text-xs font-medium text-white transition hover:bg-adm-hover"
            >
              Pular repetidos
            </button>
            <button
              type="button"
              onClick={() => resolveDuplicates("replace")}
              className="rounded-lg border border-adm-line bg-white px-3 py-1.5 text-xs font-medium text-adm-ink transition hover:bg-adm-soft"
            >
              Substituir os antigos
            </button>
            <button
              type="button"
              onClick={() => resolveDuplicates("rename")}
              className="rounded-lg border border-adm-line bg-white px-3 py-1.5 text-xs font-medium text-adm-ink transition hover:bg-adm-soft"
            >
              Enviar com outro nome
            </button>
            <button
              type="button"
              onClick={() => setPendingBatch(null)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-adm-muted hover:underline"
            >
              Não enviar nada
            </button>
          </div>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-red-800">
              {rejected.length === 1 ? "1 arquivo não foi enviado" : `${rejected.length} arquivos não foram enviados`}
            </p>
            <button
              type="button"
              onClick={() => setRejected([])}
              className="shrink-0 text-xs font-medium text-red-800 hover:underline"
            >
              Fechar
            </button>
          </div>
          <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-xs text-red-800">
            {rejected.map((r, n) => (
              <li key={`${r.name}-${n}`} className="break-words">
                {r.name}: {r.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="rounded-xl bg-adm-soft px-4 py-3 text-sm">
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
              <span className="font-medium">
                {done} de {items.filter((i) => i.status !== "cancelado").length} enviados
              </span>
              {busy && (
                <span className="text-adm-muted">
                  {formatBytes(sentBytes)} de {formatBytes(totalBytes)}
                  {speed > 0 && ` · ${(speed / 1024 ** 2).toFixed(1).replace(".", ",")} MB/s`}
                  {` · falta ${formatDuration(eta)}`}
                </span>
              )}
            </div>
            {busy && (
              <>
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-adm-line">
                  <div
                    className="h-full bg-adm-ink transition-all"
                    style={{ width: `${(sentBytes / Math.max(1, totalBytes)) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-adm-muted">Não feche esta página até terminar.</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Cancelar o envio de ${active.length} arquivo${active.length > 1 ? "s" : ""}?`))
                        cancel(active.map((i) => i.id));
                    }}
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Cancelar tudo
                  </button>
                </div>
              </>
            )}
          </div>

          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {visible.map((i) => (
              <li key={i.id} className="rounded-xl bg-adm-soft px-4 py-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="truncate">
                    {i.file.name}
                    {i.name !== storedName(i.file) && <span className="text-adm-muted"> → {i.name}</span>}
                    {i.replace && <span className="text-adm-muted"> (substitui)</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span
                      className={
                        i.status === "erro" ? "text-red-700" : i.status === "ok" ? "text-green-700" : "text-adm-muted"
                      }
                    >
                      {i.status === "erro"
                        ? "erro"
                        : i.status === "ok"
                          ? "ok"
                          : i.status === "cancelado"
                            ? "cancelado"
                            : i.status === "fila"
                              ? "na fila"
                              : `${Math.round(progressOf(i) * 100)}%`}
                    </span>
                    {i.status === "erro" && (
                      <button
                        type="button"
                        onClick={() => retry(i)}
                        className="text-xs font-medium text-adm-ink hover:underline"
                      >
                        Tentar de novo
                      </button>
                    )}
                    {(i.status === "fila" || i.status === "enviando") && (
                      <button
                        type="button"
                        onClick={() => cancel([i.id])}
                        className="text-xs text-red-700 hover:underline"
                      >
                        Cancelar
                      </button>
                    )}
                  </span>
                </div>
                {i.status === "enviando" && (
                  <div className="mt-1.5 h-1 overflow-hidden rounded bg-adm-line">
                    <div className="h-full bg-adm-ink transition-all" style={{ width: `${progressOf(i) * 100}%` }} />
                  </div>
                )}
                {i.error && <p className="mt-1 text-xs text-red-700">{i.error}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
