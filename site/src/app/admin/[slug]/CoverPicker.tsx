"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeCover } from "../actions";
import { Icon } from "../ui";
import { api, putWithRetry, scaled, toJpeg } from "./Uploader";

/**
 * Reduz a imagem, converte em JPEG aqui no navegador e envia como capa
 * (sem vídeo: capa geral da entrega). Aceita arquivo ou um quadro já desenhado num canvas.
 */
export async function uploadCover(
  slug: string,
  source: File | HTMLCanvasElement,
  video?: string,
  onStatus: (status: string) => void = () => {}
) {
  if (source instanceof File && !source.type.startsWith("image/")) throw new Error("Escolha uma imagem (JPG, PNG ou WebP).");
  onStatus("Preparando...");
  let canvas: HTMLCanvasElement;
  if (source instanceof File) {
    const bitmap = await createImageBitmap(source);
    canvas = scaled(bitmap, video ? 1920 : 2560);
    bitmap.close();
  } else {
    canvas = scaled(source, video ? 1920 : 2560);
  }
  const blob = await toJpeg(canvas, 0.88);
  onStatus("Enviando...");
  const signed = await api({ op: "cover", slug, video });
  await putWithRetry(signed.url, blob, signed.headers, () => {});
}

// Capa enviada pelo admin: a geral da entrega ou a de um vídeo.
// A própria miniatura é o botão: clique (ou solte uma imagem nela) para enviar ou trocar.
// A imagem é reduzida e convertida em JPEG aqui no navegador antes de subir para o R2.
export default function CoverPicker({
  slug,
  video,
  current,
  size = "small",
}: {
  slug: string;
  /** Sem vídeo, é a capa geral da entrega */
  video?: string;
  /** Endereço da capa atual, se houver */
  current?: string;
  size?: "small" | "large";
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [over, setOver] = useState(false);
  const [removing, startRemove] = useTransition();
  const busy = Boolean(status) || removing;
  const large = size === "large";
  const what = video ? "capa do vídeo" : "capa da entrega";

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      await uploadCover(slug, file, video, setStatus);
      router.refresh();
    } catch (err) {
      alert(`Não foi possível enviar a capa: ${(err as Error).message}`);
    } finally {
      setStatus("");
    }
  }

  function remove() {
    if (!confirm(video ? "Remover a capa deste vídeo?" : "Remover a capa da entrega?")) return;
    startRemove(async () => {
      const result = await removeCover(slug, video);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div
      data-own-drop
      className={`group relative shrink-0 ${large ? "aspect-video w-full sm:w-80" : "aspect-video w-28 sm:w-36"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        upload(e.dataTransfer.files[0]);
      }}
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (input.current) input.current.value = "";
          input.current?.click();
        }}
        aria-label={current ? `Trocar ${what}` : `Adicionar ${what}`}
        title={current ? `Trocar ${what}` : `Adicionar ${what}`}
        className={`relative grid h-full w-full place-items-center overflow-hidden rounded-2xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ink ${
          current ? "bg-adm-chip" : "border-2 border-dashed border-adm-line-strong bg-adm-soft hover:border-adm-ink hover:bg-white"
        } ${over ? "ring-2 ring-adm-ink ring-offset-2" : ""}`}
      >
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/45 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="image" className="h-4 w-4" />
                Trocar
              </span>
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1 px-2 text-center text-adm-muted">
            <Icon name={large ? "upload" : "plus"} className={large ? "h-6 w-6" : "h-4 w-4"} />
            <span className={large ? "text-sm font-medium text-adm-ink-2" : "text-[11px] font-medium"}>
              {large ? "Adicionar capa" : "Capa"}
            </span>
            {large && <span className="text-xs">Clique ou solte uma imagem horizontal</span>}
          </span>
        )}
        {status && (
          <span className="absolute inset-0 grid place-items-center bg-white/85 text-xs font-semibold text-adm-ink">{status}</span>
        )}
      </button>
      {current && !status && (
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          aria-label={`Remover ${what}`}
          title={`Remover ${what}`}
          className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-adm-ink-2 shadow transition hover:text-red-700 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 disabled:opacity-50"
        >
          <Icon name="x" className="h-3.5 w-3.5" />
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}
