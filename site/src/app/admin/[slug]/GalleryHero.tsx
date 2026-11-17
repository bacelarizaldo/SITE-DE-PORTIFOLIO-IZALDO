"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cropStyle, type CoverCrops } from "@/lib/coverCrop";
import { Icon } from "../ui";
import CoverCropEditor from "./CoverCropEditor";
import { uploadCover } from "./CoverPicker";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-9 max-w-full items-center gap-2 rounded-full bg-black/35 px-3.5 text-sm text-white ring-1 ring-white/25 backdrop-blur-md">
      {children}
    </span>
  );
}

/**
 * Topo da entrega no admin: a capa ao fundo (com o enquadramento do computador), o nome e as
 * informações principais. Daqui se troca a capa e se ajusta o enquadramento de cada tela.
 */
export default function GalleryHero({
  slug,
  title,
  cover,
  crops,
  customCover,
  dateLabel,
  link,
  photos,
  videos,
  sizeLabel,
  warnings,
}: {
  slug: string;
  title: string;
  /** Capa que o cliente vê (a enviada ou a automática) */
  cover?: string;
  crops?: CoverCrops;
  /** Há uma capa enviada no admin (e não a automática das fotos) */
  customCover: boolean;
  dateLabel?: string;
  link: string;
  photos: number;
  videos: number;
  sizeLabel: string;
  warnings: string[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      await uploadCover(slug, file, undefined, setStatus);
      router.refresh();
    } catch (err) {
      alert(`Não foi possível enviar a capa: ${(err as Error).message}`);
    } finally {
      setStatus("");
    }
  }

  const media = photos + videos;
  const shortLink = link.replace(/^https?:\/\//, "");

  return (
    <section aria-label="Capa e informações da entrega" className="relative mt-4 overflow-hidden rounded-[28px] bg-[#1c1c1e] text-white">
      <div className="relative flex min-h-[260px] flex-col justify-between md:h-[300px]">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" style={cropStyle(crops?.desktop)} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        <div className="relative flex flex-wrap justify-end gap-2 p-4">
          {cover && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-white/90 px-4 text-sm font-medium text-adm-ink shadow-sm transition hover:bg-white"
            >
              <Icon name="crop" className="h-4 w-4" />
              Ajustar enquadramento
            </button>
          )}
          <button
            type="button"
            disabled={Boolean(status)}
            onClick={() => {
              if (input.current) input.current.value = "";
              input.current?.click();
            }}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-white/90 px-4 text-sm font-medium text-adm-ink shadow-sm transition hover:bg-white disabled:opacity-70"
          >
            <Icon name="image" className="h-4 w-4" />
            {status || (customCover ? "Trocar capa" : "Enviar capa")}
          </button>
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
        </div>

        <div className="relative px-5 pt-6 pb-5 md:px-8 md:pb-8">
          <h1 className="text-[30px] leading-tight font-bold tracking-tight text-balance md:text-[42px]">{title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {dateLabel && (
              <Chip>
                <Icon name="calendar" className="h-4 w-4" />
                {dateLabel}
              </Chip>
            )}
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              title="Copiar o link da entrega"
              className="inline-flex h-9 max-w-full items-center gap-2 rounded-full bg-black/35 px-3.5 text-sm text-white ring-1 ring-white/25 backdrop-blur-md transition hover:bg-black/55"
            >
              <Icon name="link" className="h-4 w-4 shrink-0" />
              <span className="truncate">{copied ? "Link copiado!" : shortLink}</span>
            </button>
            <Chip>
              <Icon name="photos" className="h-4 w-4" />
              {media} {media === 1 ? "mídia" : "mídias"} · {photos} {photos === 1 ? "foto" : "fotos"}, {videos} {videos === 1 ? "vídeo" : "vídeos"}
            </Chip>
            <Chip>
              <Icon name="storage" className="h-4 w-4" />
              {sizeLabel}
            </Chip>
            {warnings.map((w) => (
              <span key={w} className="inline-flex h-9 items-center rounded-full bg-amber-100 px-3.5 text-sm font-medium text-amber-900">
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      {editing && cover && (
        <CoverCropEditor
          slug={slug}
          src={cover}
          initial={crops}
          onClose={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}
