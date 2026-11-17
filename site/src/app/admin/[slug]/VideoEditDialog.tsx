"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { removeCover, setVideoTitle } from "../actions";
import { Icon, btnGhost, btnPrimary } from "../ui";
import { uploadCover } from "./CoverPicker";

export type EditableVideo = { name: string; title: string; fallback: string; cover?: string; src: string };

type Choice = { kind: "keep" } | { kind: "frame"; time: number } | { kind: "file"; file: File; preview: string } | { kind: "remove" };

const FRAMES = 12;

/**
 * Editar vídeo: o nome e a capa que o cliente vê. A capa pode ser um quadro do próprio vídeo
 * (escolhido na fita ou na barra) ou uma imagem enviada.
 */
export default function VideoEditDialog({ slug, video, onClose }: { slug: string; video: EditableVideo; onClose: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(video.title);
  const [choice, setChoice] = useState<Choice>({ kind: "keep" });
  const [duration, setDuration] = useState(0);
  const [ratio, setRatio] = useState<number>();
  const [frames, setFrames] = useState<{ time: number; url: string }[]>([]);
  const [framesError, setFramesError] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // Fita de quadros: abre o vídeo escondido, pula para 12 pontos e desenha cada quadro pequeno
  useEffect(() => {
    const el = document.createElement("video");
    el.crossOrigin = "anonymous";
    el.muted = true;
    el.preload = "auto";
    el.playsInline = true;
    let cancelled = false;
    const seek = (t: number) =>
      new Promise<void>((resolve, reject) => {
        el.onseeked = () => resolve();
        el.onerror = () => reject(new Error("vídeo"));
        el.currentTime = t;
      });
    el.onloadedmetadata = async () => {
      const total = el.duration;
      if (!total || !Number.isFinite(total)) return;
      const height = 96;
      const width = Math.round((el.videoWidth / el.videoHeight) * height) || 170;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      const list: { time: number; url: string }[] = [];
      try {
        for (let i = 0; i < FRAMES && !cancelled; i++) {
          const time = (total * (i + 0.5)) / FRAMES;
          await seek(time);
          ctx.drawImage(el, 0, 0, width, height);
          list.push({ time, url: canvas.toDataURL("image/jpeg", 0.7) });
          if (!cancelled) setFrames([...list]);
        }
      } catch {
        if (!cancelled) setFramesError("Não deu para ler os quadros deste vídeo. Envie uma imagem como capa.");
      } finally {
        el.removeAttribute("src");
        el.load();
      }
    };
    el.onerror = () => !cancelled && setFramesError("Não deu para abrir o vídeo para escolher um quadro.");
    el.src = video.src;
    return () => {
      cancelled = true;
      el.onloadedmetadata = null;
      el.removeAttribute("src");
      el.load();
    };
  }, [video.src]);

  function pickFrame(time: number) {
    setChoice({ kind: "frame", time });
    if (preview.current) preview.current.currentTime = time;
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Escolha uma imagem (JPG, PNG ou WebP).");
    setError("");
    setChoice({ kind: "file", file, preview: URL.createObjectURL(file) });
  }

  async function save() {
    setError("");
    try {
      const name = title.trim();
      if (name !== video.title) {
        setStatus("Salvando o nome...");
        const result = await setVideoTitle(slug, video.name, name);
        if (result.error) throw new Error(result.error);
      }
      if (choice.kind === "frame") {
        const el = preview.current;
        if (!el || !el.videoWidth) throw new Error("O quadro ainda não carregou. Tente de novo.");
        // O quadro na resolução original do vídeo
        const canvas = document.createElement("canvas");
        canvas.width = el.videoWidth;
        canvas.height = el.videoHeight;
        canvas.getContext("2d")!.drawImage(el, 0, 0);
        await uploadCover(slug, canvas, video.name, setStatus);
      } else if (choice.kind === "file") {
        await uploadCover(slug, choice.file, video.name, setStatus);
      } else if (choice.kind === "remove") {
        setStatus("Removendo a capa...");
        const result = await removeCover(slug, video.name);
        if (result.error) throw new Error(result.error);
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError((err as Error).message || "Não foi possível salvar.");
    } finally {
      setStatus("");
    }
  }

  const showVideo = choice.kind === "frame" || (choice.kind === "keep" && !video.cover) || choice.kind === "remove";
  const shownImage = choice.kind === "file" ? choice.preview : choice.kind === "keep" ? video.cover : undefined;
  const portrait = ratio !== undefined && ratio < 0.95;

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="editar-video-titulo"
      className="m-auto w-[min(94vw,580px)] overflow-hidden rounded-[28px] bg-adm-surface p-0 text-adm-ink shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[88vh] overflow-y-auto p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="editar-video-titulo" className="text-2xl font-bold tracking-tight">
              Editar vídeo
            </h2>
            <p className="mt-1 text-sm text-adm-muted">O nome e a capa que o cliente vê na entrega.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-adm-soft text-adm-ink-2 hover:bg-adm-chip"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <label htmlFor="video-nome" className="mt-6 mb-1.5 block text-sm font-semibold">
          Nome
        </label>
        <input
          id="video-nome"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder={video.fallback}
          className="h-12 w-full rounded-2xl border border-adm-line-strong bg-white px-4 text-base outline-none transition focus:border-adm-ink focus:ring-4 focus:ring-adm-ink/10"
        />
        <p className="mt-1 text-xs text-adm-muted">Vazio usa o nome do arquivo.</p>

        <p className="mt-6 mb-2 text-sm font-semibold">Capa</p>
        <div className="grid place-items-center rounded-2xl bg-adm-soft p-3">
          <div
            style={{ aspectRatio: ratio ?? 16 / 9 }}
            className={`relative overflow-hidden rounded-xl bg-black ${portrait ? "h-[min(46vh,420px)]" : "w-full"}`}
          >
            <video
              ref={preview}
              src={video.src}
              crossOrigin="anonymous"
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={(e) => {
                const el = e.currentTarget;
                setDuration(el.duration);
                if (el.videoWidth && el.videoHeight) setRatio(el.videoWidth / el.videoHeight);
                if (el.currentTime === 0) el.currentTime = Math.min(0.1, el.duration / 2);
              }}
              className={`absolute inset-0 h-full w-full object-cover ${showVideo ? "" : "invisible"}`}
            />
            {shownImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            {choice.kind === "remove" && (
              <span className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-center text-xs text-white">
                Sem capa: aparece o primeiro quadro do vídeo
              </span>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-adm-muted">Deslize pela fita para escolher um quadro do vídeo, ou envie uma imagem.</p>
        {framesError ? (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{framesError}</p>
        ) : (
          <div className="relative mt-2">
            <div className="flex h-14 overflow-hidden rounded-xl bg-adm-chip">
              {Array.from({ length: FRAMES }, (_, i) => frames[i]).map((f, i) =>
                f ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={f.url} alt="" className="h-full min-w-0 flex-1 object-cover" />
                ) : (
                  <span key={i} className="h-full flex-1 animate-pulse bg-adm-line/60 motion-reduce:animate-none" />
                )
              )}
            </div>
            {/* A barra fica por cima da fita: arrastar escolhe o quadro exato */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step="any"
              value={choice.kind === "frame" ? choice.time : 0}
              onChange={(e) => pickFrame(Number(e.target.value))}
              disabled={!duration}
              aria-label="Escolher o quadro da capa"
              className="absolute inset-0 h-14 w-full cursor-ew-resize appearance-none bg-transparent [&::-moz-range-thumb]:h-14 [&::-moz-range-thumb]:w-9 [&::-moz-range-thumb]:rounded-lg [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:h-14 [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-lg [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (fileInput.current) fileInput.current.value = "";
              fileInput.current?.click();
            }}
            className={btnGhost}
          >
            <Icon name="upload" className="h-4 w-4" />
            Enviar imagem
          </button>
          <span className="text-xs text-adm-muted">JPG, PNG ou WebP</span>
          {video.cover && choice.kind !== "remove" && (
            <button type="button" onClick={() => setChoice({ kind: "remove" })} className="ml-auto text-sm font-medium text-red-700 hover:underline">
              Remover capa
            </button>
          )}
          {choice.kind !== "keep" && (
            <button type="button" onClick={() => setChoice({ kind: "keep" })} className="text-sm font-medium text-adm-ink-2 hover:underline">
              Desfazer
            </button>
          )}
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-adm-line bg-adm-soft px-6 py-4 md:px-8">
        <button type="button" onClick={onClose} className={btnGhost}>
          Cancelar
        </button>
        <button type="button" onClick={save} disabled={Boolean(status)} className={btnPrimary}>
          {status || "Salvar"}
        </button>
      </div>
    </dialog>
  );
}
