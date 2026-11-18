"use client";

import { useState, useTransition } from "react";
import { deleteFile, setVideoOrder } from "../actions";
import ConfirmButton from "./ConfirmButton";
import VideoEditDialog from "./VideoEditDialog";
import { Icon } from "../ui";

export type AdminVideo = { key: string; name: string; size: string; title: string; fallback: string; cover?: string; src: string; month?: string; uploadMonth?: string; monthLabel?: string };

function VideoRow({
  slug,
  video,
  position,
  total,
  onMove,
  onEdit,
}: {
  slug: string;
  video: AdminVideo;
  position: number;
  total: number;
  onMove: (step: -1 | 1) => void;
  onEdit: () => void;
}) {
  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-full text-adm-ink-2 transition hover:bg-white hover:text-adm-ink disabled:pointer-events-none disabled:opacity-25";

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar nome e capa de ${video.title}`}
        className="group relative aspect-video w-28 shrink-0 overflow-hidden rounded-2xl bg-adm-chip sm:w-36"
      >
        {video.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video src={`${video.src}#t=0.1`} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/45 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
          {video.cover ? "Trocar capa" : "Escolher capa"}
        </span>
      </button>

      <div className="min-w-[9rem] flex-1">
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="max-w-full truncate text-[15px] font-semibold text-adm-ink">{video.title}</span>
          {position === 0 && total > 1 && (
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-adm-ink-2 ring-1 ring-adm-line">
              Abre primeiro
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-adm-muted" title={video.name}>
          {video.size}
          {video.monthLabel && ` · ${video.monthLabel}`} · {video.name}
          {!video.cover && " · sem capa"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {total > 1 && (
          <>
            <button type="button" onClick={() => onMove(-1)} disabled={position === 0} aria-label={`Subir ${video.title}`} title="Subir na ordem" className={iconBtn}>
              <Icon name="up" className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onMove(1)} disabled={position === total - 1} aria-label={`Descer ${video.title}`} title="Descer na ordem" className={iconBtn}>
              <Icon name="down" className="h-4 w-4" />
            </button>
          </>
        )}
        <button type="button" onClick={onEdit} aria-label={`Editar ${video.title}`} title="Editar nome e capa" className={iconBtn}>
          <Icon name="edit" className="h-4 w-4" />
        </button>
        <form action={deleteFile}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="key" value={video.key} />
          <ConfirmButton message={`Excluir o vídeo "${video.title}"? Não dá para desfazer.`} className={`${iconBtn} hover:!bg-red-50 hover:!text-red-700`}>
            <span className="sr-only">Excluir {video.title}</span>
            <Icon name="trash" className="h-4 w-4" />
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}

export default function VideoList({ slug, videos }: { slug: string; videos: AdminVideo[] }) {
  // A ordem muda na hora na tela; o servidor salva em seguida
  const [order, setOrder] = useState(() => videos.map((v) => v.name));
  const [saving, startSaving] = useTransition();
  const [editing, setEditing] = useState<AdminVideo | null>(null);
  const known = new Set(order);
  const names = [...order.filter((n) => videos.some((v) => v.name === n)), ...videos.map((v) => v.name).filter((n) => !known.has(n))];
  const sorted = names.map((n) => videos.find((v) => v.name === n)!);

  function move(index: number, step: -1 | 1) {
    const next = [...names];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    const previous = order;
    setOrder(next);
    startSaving(async () => {
      const result = await setVideoOrder(slug, next);
      if (result.error) {
        setOrder(previous);
        alert(result.error);
      }
    });
  }

  return (
    <>
      {saving && (
        <p role="status" className="mb-2 text-xs text-adm-muted">
          Salvando a ordem...
        </p>
      )}
      <ul className="divide-y divide-adm-line overflow-hidden rounded-[22px] bg-adm-soft">
        {sorted.map((v, i) => (
          <VideoRow
            key={`${v.key}:${v.title}`}
            slug={slug}
            video={v}
            position={i}
            total={sorted.length}
            onMove={(step) => move(i, step)}
            onEdit={() => setEditing(v)}
          />
        ))}
      </ul>
      {editing && <VideoEditDialog slug={slug} video={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
