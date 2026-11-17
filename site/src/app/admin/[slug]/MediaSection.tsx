"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { deleteFile } from "../actions";
import { Icon, Pill, btnPrimary, card } from "../ui";
import ConfirmButton from "./ConfirmButton";
import { type AdminPhoto } from "./PhotoGrid";
import PhotosPanel, { type AdminAlbum } from "./PhotosPanel";
import Uploader from "./Uploader";
import VideoEditDialog from "./VideoEditDialog";
import VideoList, { type AdminVideo } from "./VideoList";

type Tab = "tudo" | "fotos" | "videos";
type View = "grade" | "lista";
type Media = { kind: "photo"; photo: AdminPhoto } | { kind: "video"; video: AdminVideo };

const OPEN_UPLOAD = "ib:enviar-midias";
const VIEW_KEY = "ib:midias-visao";
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|avi)$/i;
const isVideoFile = (f: File) => f.type.startsWith("video/") || VIDEO_EXT.test(f.name);
const fileName = (name: string) => name.slice(name.lastIndexOf("/") + 1);
const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Lembra a escolha entre grade e lista neste computador
function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "lista" ? "lista" : "grade";
  } catch {
    return "grade";
  }
}
function subscribeView(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Botão "Enviar mídias" do topo da página: abre a escolha de arquivos da grade de mídias. */
export function SendMediaButton() {
  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById("midias")?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.dispatchEvent(new Event(OPEN_UPLOAD));
      }}
      className={btnPrimary}
    >
      <Icon name="upload" className="h-4 w-4" />
      Enviar mídias
    </button>
  );
}

function DeleteMedia({ slug, item, className }: { slug: string; item: Media; className: string }) {
  const key = item.kind === "photo" ? item.photo.key : item.video.key;
  const label = item.kind === "photo" ? fileName(item.photo.name) : item.video.title;
  return (
    <form action={deleteFile}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="key" value={key} />
      <ConfirmButton message={`Excluir ${item.kind === "photo" ? "a foto" : "o vídeo"} "${label}"? Não dá para desfazer.`} className={className}>
        <span className="sr-only">Excluir {label}</span>
        <Icon name="trash" className="h-4 w-4" />
      </ConfirmButton>
    </form>
  );
}

/**
 * Fotos e vídeos da entrega numa grade só. "Tudo" junta os dois (com busca e troca entre grade e lista);
 * as abas Fotos e Vídeos têm as ferramentas de cada um (álbuns, favoritas, ordem dos vídeos).
 * Soltar arquivos em qualquer ponto da seção envia: vídeos vão para Vídeos, fotos para o álbum principal.
 */
export default function MediaSection({
  slug,
  photos,
  videos,
  albums,
  favorites,
  cover,
  coverChosen,
  coverOverridden,
  totalLabel,
  children,
}: {
  slug: string;
  photos: AdminPhoto[];
  videos: AdminVideo[];
  albums: AdminAlbum[];
  favorites: string[];
  cover?: string;
  coverChosen: boolean;
  coverOverridden: boolean;
  totalLabel: string;
  /** Avisos extras no topo da seção (ex.: otimização das fotos antigas) */
  children?: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("tudo");
  const savedView = useSyncExternalStore(subscribeView, readView, () => "grade" as View);
  const [chosenView, setChosenView] = useState<View | null>(null);
  const view = chosenView ?? savedView;
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState<AdminVideo | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLElement>(null);
  const sendPhotos = useRef<(files: File[]) => void>(() => {});
  const sendVideos = useRef<(files: File[]) => void>(() => {});
  const photosHandle = useCallback((start: (files: File[]) => void) => (sendPhotos.current = start), []);
  const videosHandle = useCallback((start: (files: File[]) => void) => (sendVideos.current = start), []);

  const route = useCallback((files: File[]) => {
    const list = files.filter((f) => f.size > 0 || f.name);
    const vids = list.filter(isVideoFile);
    const rest = list.filter((f) => !isVideoFile(f));
    if (vids.length) sendVideos.current(vids);
    // O envio de fotos também recusa (com o motivo) o que não for imagem
    if (rest.length) sendPhotos.current(rest);
  }, []);

  useEffect(() => {
    const open = () => {
      if (input.current) input.current.value = "";
      input.current?.click();
    };
    window.addEventListener(OPEN_UPLOAD, open);
    return () => window.removeEventListener(OPEN_UPLOAD, open);
  }, []);

  // Soltar arquivos em qualquer ponto da seção
  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const own = (e: DragEvent) => (e.target as Element | null)?.closest?.("[data-own-drop]");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e) || own(e)) return;
      depth++;
      setDragging(true);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e) && !own(e)) e.preventDefault();
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e) || own(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e) || own(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      route(Array.from(e.dataTransfer?.files ?? []));
    };
    el.addEventListener("dragenter", enter);
    el.addEventListener("dragover", over);
    el.addEventListener("dragleave", leave);
    el.addEventListener("drop", drop);
    return () => {
      el.removeEventListener("dragenter", enter);
      el.removeEventListener("dragover", over);
      el.removeEventListener("dragleave", leave);
      el.removeEventListener("drop", drop);
    };
  }, [route]);

  const all: Media[] = useMemo(
    () => [...videos.map((video) => ({ kind: "video" as const, video })), ...photos.map((photo) => ({ kind: "photo" as const, photo }))],
    [videos, photos]
  );
  const shown = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return all;
    return all.filter((m) =>
      normalize(m.kind === "photo" ? m.photo.name : `${m.video.title} ${m.video.name}`).includes(q)
    );
  }, [all, query]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "tudo", label: "Tudo", count: all.length },
    { id: "fotos", label: "Fotos", count: photos.length },
    { id: "videos", label: "Vídeos", count: videos.length },
  ];

  function chooseView(next: View) {
    setChosenView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  }

  const mainAlbumPhotos = photos.filter((p) => !p.name.includes("/")).map((p) => fileName(p.name));

  return (
    <section
      id="midias"
      ref={zone}
      data-drop-router
      aria-labelledby="midias-titulo"
      className={`${card} scroll-mt-24 transition-shadow lg:scroll-mt-8 ${dragging ? "ring-2 ring-adm-ink ring-offset-4 ring-offset-adm-bg" : ""}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-2xl bg-adm-soft text-adm-ink-2 sm:grid">
            <Icon name="photos" />
          </span>
          <h2 id="midias-titulo" className="flex items-center gap-2 text-lg font-semibold">
            Mídias <Pill>{totalLabel}</Pill>
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            if (input.current) input.current.value = "";
            input.current?.click();
          }}
          className={btnPrimary}
        >
          <Icon name="upload" className="h-4 w-4" />
          Enviar mídias
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/*,video/*,.heic,.heif,.dng,.cr2,.cr3,.nef,.arw,.mov,.mkv"
          hidden
          onChange={(e) => route(Array.from(e.target.files ?? []))}
        />
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Tipo de mídia" className="flex gap-1 rounded-full bg-adm-soft p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                tab === t.id ? "bg-adm-ink text-white" : "text-adm-ink-2 hover:text-adm-ink"
              }`}
            >
              {t.label}
              <span className={`text-xs tabular-nums ${tab === t.id ? "text-white/70" : "text-adm-muted"}`}>{t.count}</span>
            </button>
          ))}
        </div>
        {tab === "tudo" && (
          <>
            <label className="relative ml-auto block w-full sm:w-64">
              <span className="sr-only">Buscar mídias</span>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-adm-muted" />
              <input
                id="buscar-midias"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar mídias"
                className="h-10 w-full rounded-full border border-adm-line bg-adm-soft pr-4 pl-10 text-sm outline-none transition focus:border-adm-ink focus:bg-white focus:ring-4 focus:ring-adm-ink/10"
              />
            </label>
            <div role="group" aria-label="Visualização" className="flex gap-1 rounded-full bg-adm-soft p-1">
              {(["grade", "lista"] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => chooseView(v)}
                  aria-pressed={view === v}
                  aria-label={v === "grade" ? "Ver em grade" : "Ver em lista"}
                  className={`grid h-8 w-8 place-items-center rounded-full transition ${view === v ? "bg-adm-ink text-white" : "text-adm-ink-2 hover:text-adm-ink"}`}
                >
                  <Icon name={v === "grade" ? "grid" : "list"} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}

      {/* Envio de "Enviar mídias" e do soltar na seção: ficam sempre montados para o envio não parar ao trocar de aba */}
      <div className="mt-2">
        <Uploader slug={slug} category="videos" label="Enviar vídeos" existing={videos.map((v) => v.name)} handle={videosHandle} bare />
        <Uploader slug={slug} category="photos" album="" label="Enviar fotos" existing={mainAlbumPhotos} handle={photosHandle} bare />
      </div>

      {/* As três abas ficam montadas (só escondidas) para não interromper envios em andamento */}
      <div hidden={tab !== "tudo"} className="mt-4">
        {shown.length === 0 ? (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-adm-line bg-adm-soft px-6 py-14 text-center transition hover:border-adm-line-strong"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-adm-ink-2 shadow-sm">
              <Icon name="upload" className="h-5 w-5" />
            </span>
            <span className="font-semibold">{query ? `Nada encontrado para "${query}"` : "Arraste fotos e vídeos para qualquer lugar daqui"}</span>
            {!query && <span className="text-sm text-adm-muted">ou clique para escolher</span>}
          </button>
        ) : view === "grade" ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((m) => {
              const key = m.kind === "photo" ? m.photo.key : m.video.key;
              const thumb = m.kind === "photo" ? m.photo.thumb : m.video.cover;
              const label = m.kind === "photo" ? fileName(m.photo.name) : m.video.title;
              return (
                <li key={key} className="group relative aspect-square overflow-hidden rounded-2xl bg-adm-chip">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : m.kind === "video" ? (
                    <video src={`${m.video.src}#t=0.1`} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  {m.kind === "video" ? (
                    <button type="button" onClick={() => setEditing(m.video)} aria-label={`Editar ${label}`} className="absolute inset-0" />
                  ) : (
                    <a href={m.photo.thumb} target="_blank" rel="noreferrer" aria-label={`Abrir ${label}`} className="absolute inset-0" />
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5">
                    {m.kind === "video" && (
                      <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">▶ Vídeo</span>
                    )}
                    <span className="block truncate text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">{label}</span>
                  </span>
                  <span className="absolute top-2 right-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                    <DeleteMedia slug={slug} item={m} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-adm-ink-2 shadow hover:text-red-700" />
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="divide-y divide-adm-line overflow-hidden rounded-[22px] bg-adm-soft">
            {shown.map((m) => {
              const key = m.kind === "photo" ? m.photo.key : m.video.key;
              const thumb = m.kind === "photo" ? m.photo.thumb : m.video.cover;
              const label = m.kind === "photo" ? fileName(m.photo.name) : m.video.title;
              const size = m.kind === "photo" ? m.photo.size : m.video.size;
              return (
                <li key={key} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-adm-chip">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    ) : m.kind === "video" ? (
                      <video src={`${m.video.src}#t=0.1`} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-adm-muted">
                      {m.kind === "photo" ? "Foto" : "Vídeo"} · {size}
                    </span>
                  </span>
                  {m.kind === "video" && (
                    <button
                      type="button"
                      onClick={() => setEditing(m.video)}
                      aria-label={`Editar ${label}`}
                      className="grid h-9 w-9 place-items-center rounded-full text-adm-ink-2 hover:bg-white hover:text-adm-ink"
                    >
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                  )}
                  <DeleteMedia slug={slug} item={m} className="grid h-9 w-9 place-items-center rounded-full text-adm-ink-2 hover:bg-red-50 hover:text-red-700" />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div hidden={tab !== "fotos"} className="mt-4">
        <PhotosPanel
          slug={slug}
          albums={albums}
          photos={photos}
          favorites={favorites}
          cover={cover}
          coverChosen={coverChosen}
          coverOverridden={coverOverridden}
          totalLabel={totalLabel}
        />
      </div>

      <div hidden={tab !== "videos"} className="mt-4">
        {videos.length ? (
          <VideoList slug={slug} videos={videos} />
        ) : (
          <p className="rounded-2xl bg-adm-soft px-4 py-6 text-center text-sm text-adm-muted">Nenhum vídeo ainda. Solte os arquivos aqui ou use Enviar mídias.</p>
        )}
      </div>

      {editing && <VideoEditDialog slug={slug} video={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
