"use client";

import { useState, useTransition } from "react";
import { deleteFile } from "../actions";
import HeartIcon from "../../entrega/HeartIcon";

export type AdminPhoto = { key: string; name: string; size: string; thumb: string };

// Nome do arquivo, sem a pasta do álbum
const fileName = (name: string) => name.slice(name.lastIndexOf("/") + 1);

export default function PhotoGrid({
  slug,
  photos,
  favorites,
  cover,
  onSetCover,
}: {
  slug: string;
  photos: AdminPhoto[];
  favorites: string[];
  cover?: string;
  onSetCover: (name: string) => void;
}) {
  // Esconde a foto na hora; o servidor apaga em seguida
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const favoriteSet = new Set(favorites);

  function remove(photo: AdminPhoto) {
    if (!confirm(`Excluir ${fileName(photo.name)}?`)) return;
    setRemoved((s) => new Set(s).add(photo.key));
    const data = new FormData();
    data.set("slug", slug);
    data.set("key", photo.key);
    startTransition(async () => {
      try {
        await deleteFile(data);
      } catch {
        setRemoved((s) => {
          const next = new Set(s);
          next.delete(photo.key);
          return next;
        });
        alert(`Não foi possível excluir ${fileName(photo.name)}. Tente de novo.`);
      }
    });
  }

  const existing = photos.filter((p) => !removed.has(p.key));
  const favoritePhotos = existing.filter((p) => favoriteSet.has(p.name));
  const visible = onlyFavorites ? favoritePhotos : existing;
  const tab = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active ? "bg-adm-pill text-white" : "bg-adm-surface text-adm-ink-2 ring-1 ring-adm-line hover:ring-adm-line-strong"
    }`;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOnlyFavorites(false)} className={tab(!onlyFavorites)}>
          Todas ({existing.length})
        </button>
        <button
          type="button"
          onClick={() => setOnlyFavorites(true)}
          className={`${tab(onlyFavorites)} inline-flex items-center gap-1.5`}
        >
          <HeartIcon filled className="h-3.5 w-3.5" />
          Favoritas do cliente ({favoritePhotos.length})
        </button>
        {onlyFavorites && favoritePhotos.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(favoritePhotos.map((p) => fileName(p.name)).join("\n"));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="ml-auto inline-flex h-9 items-center rounded-full px-4 text-sm font-medium ring-1 ring-adm-line transition hover:ring-adm-line-strong bg-white"
          >
            {copied ? "Copiado!" : "Copiar nomes dos arquivos"}
          </button>
        )}
      </div>

      {onlyFavorites && favoritePhotos.length === 0 ? (
        <p className="rounded-2xl bg-adm-soft px-4 py-10 text-center text-sm text-adm-muted">
          O cliente ainda não favoritou nenhuma foto.
        </p>
      ) : (
        <ul className="grid max-h-[36rem] grid-cols-3 gap-2 overflow-y-auto rounded-[22px] bg-adm-soft p-2 sm:grid-cols-4 md:grid-cols-6">
          {visible.map((p) => (
            <li key={p.key} className="group relative aspect-square overflow-hidden rounded-xl bg-adm-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumb} alt={fileName(p.name)} loading="lazy" className="h-full w-full object-cover" />
              {favoriteSet.has(p.name) && (
                <span
                  title="Favorita do cliente"
                  className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#c2410c] shadow"
                >
                  <HeartIcon filled className="h-3.5 w-3.5" />
                </span>
              )}
              {p.name === cover ? (
                <span className="absolute bottom-1.5 left-1.5 z-10 rounded-full bg-adm-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                  Capa
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetCover(p.name)}
                  className="absolute bottom-1.5 left-1.5 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-adm-ink shadow transition hover:bg-white md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                >
                  Usar como capa
                </button>
              )}
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-2 pb-6 pt-1.5 pl-10 pr-11 text-[11px] leading-tight text-white opacity-0 transition group-hover:opacity-100">
                <span className="block truncate">{fileName(p.name)}</span>
                <span className="text-white/70">{p.size}</span>
              </div>
              <button
                type="button"
                onClick={() => remove(p)}
                aria-label={`Excluir ${fileName(p.name)}`}
                title="Excluir"
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-700 shadow transition hover:bg-red-600 hover:text-white md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
