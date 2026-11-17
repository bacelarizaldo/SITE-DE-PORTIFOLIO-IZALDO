"use client";

import { useState, useTransition } from "react";
import { deleteFile, setVideoOrder, setVideoTitle } from "../actions";
import ConfirmButton from "./ConfirmButton";
import CoverPicker from "./CoverPicker";
import { Icon } from "../ui";

export type AdminVideo = { key: string; name: string; size: string; title: string; fallback: string; cover?: string };

function VideoRow({
  slug,
  video,
  position,
  total,
  onMove,
}: {
  slug: string;
  video: AdminVideo;
  position: number;
  total: number;
  onMove: (step: -1 | 1) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(video.title);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    startTransition(async () => {
      const result = await setVideoTitle(slug, video.name, value);
      if (result.error) setError(result.error);
      else setEditing(false);
    });
  }

  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-full text-adm-ink-2 transition hover:bg-white hover:text-adm-ink disabled:pointer-events-none disabled:opacity-25";

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
      <CoverPicker slug={slug} video={video.name} current={video.cover} />

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex min-w-[14rem] flex-1 flex-wrap items-center gap-2"
        >
          <label htmlFor={`titulo-${video.name}`} className="sr-only">
            Título do vídeo
          </label>
          <input
            id={`titulo-${video.name}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            maxLength={120}
            placeholder={video.fallback}
            className="h-10 min-w-0 flex-1 rounded-full border border-adm-line-strong bg-white px-4 text-[15px] outline-none focus:border-adm-ink focus:ring-4 focus:ring-adm-ink/10"
          />
          <button
            disabled={pending}
            className="h-10 rounded-full bg-adm-ink px-5 text-sm font-semibold text-white hover:bg-adm-hover disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setValue(video.title);
              setEditing(false);
              setError("");
            }}
            className="h-10 rounded-full px-4 text-sm text-adm-muted hover:bg-white"
          >
            Cancelar
          </button>
          <p className="w-full px-1 text-xs text-adm-muted">
            {error ? <span className="text-red-700">{error}</span> : "Vazio usa o nome do arquivo."}
          </p>
        </form>
      ) : (
        <>
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
              {video.size} · {video.name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onMove(-1)}
                  disabled={position === 0}
                  aria-label={`Subir ${video.title}`}
                  title="Subir na ordem"
                  className={iconBtn}
                >
                  <Icon name="up" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(1)}
                  disabled={position === total - 1}
                  aria-label={`Descer ${video.title}`}
                  title="Descer na ordem"
                  className={iconBtn}
                >
                  <Icon name="down" className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Editar título de ${video.title}`}
              title="Editar título"
              className={iconBtn}
            >
              <Icon name="edit" className="h-4 w-4" />
            </button>
            <form action={deleteFile}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="key" value={video.key} />
              <ConfirmButton
                message={`Excluir o vídeo "${video.title}"? Não dá para desfazer.`}
                className={`${iconBtn} hover:!bg-red-50 hover:!text-red-700`}
              >
                <span className="sr-only">Excluir {video.title}</span>
                <Icon name="trash" className="h-4 w-4" />
              </ConfirmButton>
            </form>
          </div>
        </>
      )}
    </li>
  );
}

export default function VideoList({ slug, videos }: { slug: string; videos: AdminVideo[] }) {
  // A ordem muda na hora na tela; o servidor salva em seguida
  const [order, setOrder] = useState(() => videos.map((v) => v.name));
  const [saving, startSaving] = useTransition();
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
          />
        ))}
      </ul>
    </>
  );
}
