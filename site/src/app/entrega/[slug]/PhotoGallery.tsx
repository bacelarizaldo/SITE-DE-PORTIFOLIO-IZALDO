"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatSize } from "@/lib/format";
import { setFavorite } from "../actions";
import HeartIcon from "../HeartIcon";
import TopBar from "./TopBar";
import DownloadMenu, { DownloadIcon, useZipDownload, type DownloadOption } from "./DownloadMenu";
import { useDialogFocus } from "./useDialogFocus";

export type Album = { id: string; title: string };

export type PhotoItem = {
  /** Caminho dentro da galeria: "arquivo.jpg" ou "<álbum>/arquivo.jpg" */
  name: string;
  album: string;
  /** Nome do arquivo, usado dentro do .zip */
  file: string;
  size: number;
  thumb: string;
  web: string;
  download: string;
  /** Largura e altura (proporção) para reservar o espaço antes de a foto carregar */
  w: number;
  h: number;
};

// Mostra a foto suavemente quando termina de carregar (inclusive se já veio do cache)
function markLoaded(img: HTMLImageElement | null) {
  if (img?.complete && img.naturalWidth) img.dataset.loaded = "true";
}

// Se a miniatura falhar (conexão oscilando), tenta de novo até 2 vezes
function retryImage(img: HTMLImageElement) {
  const attempt = Number(img.dataset.retry ?? 0);
  if (attempt >= 2) return;
  img.dataset.retry = String(attempt + 1);
  setTimeout(() => {
    const src = img.src;
    img.removeAttribute("src");
    img.src = src;
  }, 1500 * (attempt + 1));
}

function Tile({
  photo,
  favorite,
  selecting,
  selected,
  onOpen,
  onToggle,
  onSelect,
}: {
  photo: PhotoItem;
  favorite: boolean;
  /** Modo de seleção: tocar marca a foto em vez de abrir */
  selecting: boolean;
  selected: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onSelect: () => void;
}) {
  // Segurar o dedo na foto (celular) já entra no modo de seleção com ela marcada
  const press = useRef<{ timer?: ReturnType<typeof setTimeout>; long: boolean }>({ long: false });
  const startPress = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    press.current.long = false;
    press.current.timer = setTimeout(() => {
      press.current.long = true;
      navigator.vibrate?.(20);
      onSelect();
    }, 450);
  };
  const cancelPress = () => clearTimeout(press.current.timer);

  return (
    // Linhas justificadas (estilo Google Fotos): cada foto cresce na proporção da sua largura,
    // então todas da mesma linha ficam com a mesma altura e a linha ocupa a largura toda.
    <div
      className="group relative min-w-0 overflow-hidden bg-white/10"
      style={{
        aspectRatio: `${photo.w} / ${photo.h}`,
        flexGrow: photo.w / photo.h,
        flexBasis: `calc(var(--row-h) * ${photo.w / photo.h})`,
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (press.current.long) {
            press.current.long = false;
            return;
          }
          if (selecting) onSelect();
          else onOpen();
        }}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 select-none [-webkit-touch-callout:none]"
        aria-label={selecting ? `Selecionar ${photo.file}` : `Abrir ${photo.name}`}
        aria-pressed={selecting ? selected : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={markLoaded}
          src={photo.thumb}
          alt=""
          width={photo.w}
          height={photo.h}
          loading="lazy"
          decoding="async"
          onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
          onError={(e) => retryImage(e.currentTarget)}
          draggable={false}
          className={`h-full w-full object-cover opacity-0 transition-[opacity,transform] duration-300 data-loaded:opacity-100 ${
            selected ? "scale-[0.88] rounded-md" : ""
          }`}
        />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent opacity-0 transition group-hover:opacity-100" />
        {selecting && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow ${
              selected ? "border-accent bg-accent text-ink" : "border-white bg-black/20"
            }`}
          >
            {selected && (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </span>
        )}
      </button>
      {!selecting && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={favorite ? "Remover das favoritas" : "Adicionar às favoritas"}
          aria-pressed={favorite}
          className={`absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 ${
            favorite
              ? "flex text-accent"
              : "hidden text-paper md:flex md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
          }`}
        >
          <HeartIcon filled={favorite} className="h-[18px] w-[18px]" />
        </button>
      )}
      {!selecting && (
        <a
          href={photo.download}
          aria-label={`Baixar ${photo.file}`}
          title="Baixar"
          className="absolute bottom-2 right-2 hidden h-9 w-9 items-center justify-center rounded-full bg-white/90 text-paper shadow transition hover:scale-110 md:flex"
        >
          <DownloadIcon className="h-[18px] w-[18px]" />
        </a>
      )}
    </div>
  );
}

const FAVORITES = "__favoritas";
// Nome de pasta dentro do .zip (pode ter acento) e nome do .zip (só ASCII)
const safeName = (text: string) => text.replace(/[\\/:*?"<>|]+/g, "-").trim() || "Fotos";
const asciiName = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "e")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "") || "fotos";

/** Pacote .zip de uma lista de fotos; com mais de um álbum, cada um vira uma pasta */
function photoZip(
  label: string,
  list: PhotoItem[],
  filename: string,
  albums: Album[]
): Extract<DownloadOption, { kind: "zip" }> {
  const albumTitle = (id: string) => albums.find((a) => a.id === id)?.title ?? "Fotos";
  const folders = new Set(list.map((p) => p.album)).size > 1;
  const bytes = list.reduce((a, p) => a + p.size, 0);
  return {
    kind: "zip",
    label,
    detail: `${list.length} ${list.length === 1 ? "foto" : "fotos"} · ${formatSize(bytes)}`,
    filename,
    files: list.map((p) => ({
      url: p.download,
      size: p.size,
      name: folders ? `${safeName(albumTitle(p.album))}/${p.file}` : p.file,
    })),
  };
}

export default function PhotoGallery({
  slug,
  link,
  title,
  admin,
  albums,
  photos,
  initialFavorites,
  extraDownloads,
}: {
  slug: string;
  /** Final do link da galeria (com o código), usado para salvar as favoritas */
  link: string;
  title: string;
  admin: boolean;
  albums: Album[];
  photos: PhotoItem[];
  initialFavorites: string[];
  /** Vídeos e arquivos extras, oferecidos no mesmo menu de download */
  extraDownloads: DownloadOption[];
}) {
  const [favorites, setFavorites] = useState(() => new Set(initialFavorites));
  const albumsWithPhotos = useMemo(() => albums.filter((a) => photos.some((p) => p.album === a.id)), [albums, photos]);
  // Aba atual: id do álbum ou as favoritas
  const [tab, setTab] = useState(() => albumsWithPhotos[0]?.id ?? "");
  const grid = useRef<HTMLDivElement>(null);
  const lightbox = useRef<HTMLDivElement>(null);
  // O visualizador guarda a lista de quando foi aberto, para tirar dos favoritos não pular de foto
  const [viewer, setViewer] = useState<{ list: PhotoItem[]; index: number } | null>(null);
  const [touchX, setTouchX] = useState<number | null>(null);
  const saving = useRef(Promise.resolve());
  // Seleção de fotos para baixar só as escolhidas
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const selectedDownload = useZipDownload();

  function toggleSelected(name: string) {
    setSelecting(true);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  function downloadSelected() {
    const list = photos.filter((p) => selected.has(p.name));
    if (!list.length) return;
    if (list.length === 1) {
      // Uma foto só: baixa o arquivo direto, sem .zip
      location.href = list[0].download;
    } else {
      selectedDownload.download(photoZip("Selecionadas", list, `${asciiName(title)}-selecionadas.zip`, albums));
    }
    stopSelecting();
  }


  const visible = useMemo(
    () =>
      photos.filter((p) =>
        tab === FAVORITES ? favorites.has(p.name) : p.album === tab
      ),
    [photos, favorites, tab]
  );
  const selectedList = photos.filter((p) => selected.has(p.name));
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.name));

  // Opções do "Baixar": tudo, cada álbum, favoritas, vídeos
  const downloadOptions = useMemo(() => {
    const zip = (label: string, list: PhotoItem[], suffix: string) =>
      photoZip(label, list, `${asciiName(title)}${suffix}.zip`, albums);
    const options: DownloadOption[] = [zip("Todas as fotos", photos, "")];
    if (albumsWithPhotos.length > 1) {
      for (const a of albumsWithPhotos) {
        options.push(zip(a.title, photos.filter((p) => p.album === a.id), `-${asciiName(a.title)}`));
      }
    }
    const favoriteList = photos.filter((p) => favorites.has(p.name));
    if (favoriteList.length) options.push(zip("Favoritas", favoriteList, "-favoritas"));
    return [...options, ...extraDownloads];
  }, [photos, favorites, albums, albumsWithPhotos, title, extraDownloads]);

  function toggleFavorite(name: string) {
    const favorite = !favorites.has(name);
    const apply = (value: boolean) =>
      setFavorites((current) => {
        const next = new Set(current);
        if (value) next.add(name);
        else next.delete(name);
        return next;
      });
    apply(favorite);
    // Salva uma de cada vez, na ordem dos cliques
    saving.current = saving.current.then(() =>
      setFavorite(link, name, favorite).catch(() => {
        apply(!favorite);
        alert("Não foi possível salvar a favorita. Verifique a internet e tente de novo.");
      })
    );
  }

  const close = useCallback(() => setViewer(null), []);
  const step = useCallback(
    (dir: number) =>
      setViewer((v) => (v ? { ...v, index: (v.index + dir + v.list.length) % v.list.length } : v)),
    []
  );

  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [viewer, close, step]);

  // Já baixa a próxima e a anterior, para a troca ser instantânea
  useEffect(() => {
    if (!viewer || viewer.list.length < 2) return;
    const { list, index } = viewer;
    for (const i of [index + 1, index - 1]) new Image().src = list[(i + list.length) % list.length].web;
  }, [viewer]);

  useDialogFocus(lightbox, viewer !== null);

  const photo = viewer ? viewer.list[viewer.index] : null;
  const tabClass = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
      active ? "bg-accent text-ink" : "bg-white/5 text-paper/80 hover:bg-white/10"
    }`;

  return (
    <section id="fotos" className="scroll-mt-16 py-12 lg:py-20">
      <TopBar title={title} slug={slug} admin={admin}>
        <DownloadMenu options={downloadOptions} />
      </TopBar>

      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-x-6 gap-y-5 px-6 md:px-10">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-mist">Galeria</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Fotos</h2>
          <p className="mt-3 text-base text-paper/75">
            {photos.length} fotos · toque no <HeartIcon filled className="inline h-4 w-4 align-[-2px] text-accent" /> para
            separar as favoritas
          </p>
        </div>
      </div>

      <div className="sticky top-16 z-20 mt-6 bg-ink/90 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 md:px-10">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
            {albumsWithPhotos.map((a) => (
              <button key={a.id} type="button" onClick={() => setTab(a.id)} className={tabClass(tab === a.id)}>
                {albumsWithPhotos.length > 1 ? a.title : "Todas"} ({photos.filter((p) => p.album === a.id).length})
              </button>
            ))}
            <button type="button" onClick={() => setTab(FAVORITES)} className={tabClass(tab === FAVORITES)}>
              <HeartIcon filled className="h-4 w-4" />
              Favoritas ({favorites.size})
            </button>
          </div>
          {visible.length > 0 && (
            <button
              type="button"
              onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
              aria-pressed={selecting}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selecting ? "border-accent bg-accent text-ink" : "border-paper/60 text-paper hover:bg-white/10"
              }`}
            >
              {selecting ? "Cancelar" : "Selecionar"}
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mx-6 mt-6 rounded-[24px] border border-dashed border-line px-6 py-16 text-center md:mx-auto md:max-w-3xl">
          <HeartIcon filled={false} className="mx-auto h-8 w-8 text-accent" />
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-paper/75">
            Nenhuma favorita ainda. Abra uma foto e toque no coração para separar aqui as que você mais gostar.
          </p>
        </div>
      ) : (
        // O ::after com crescimento enorme segura a última linha, que não estica para encher a largura
        <div
          ref={grid}
          className="mx-auto mt-2 flex max-w-[1800px] scroll-mt-32 flex-wrap items-start gap-1 px-1 [--row-h:118px] after:grow-[1000000] after:content-[''] sm:[--row-h:160px] md:px-4 md:[--row-h:210px] lg:[--row-h:250px]"
        >
          {visible.map((photo, index) => (
            <Tile
              key={photo.name}
              photo={photo}
              favorite={favorites.has(photo.name)}
              selecting={selecting}
              selected={selected.has(photo.name)}
              onOpen={() => setViewer({ list: visible, index })}
              onToggle={() => toggleFavorite(photo.name)}
              onSelect={() => toggleSelected(photo.name)}
            />
          ))}
        </div>
      )}

      {selecting && (
        <div
          role="region"
          aria-label="Fotos selecionadas"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-accent px-4 pt-3 text-ink shadow-[0_-8px_24px_rgba(0,0,0,0.18)] pb-[max(env(safe-area-inset-bottom),12px)]"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1" aria-live="polite">
              <p className="text-sm font-semibold">
                {selectedList.length
                  ? `${selectedList.length} ${selectedList.length === 1 ? "selecionada" : "selecionadas"}`
                  : "Toque nas fotos para selecionar"}
              </p>
              {selectedList.length > 0 && (
                <p className="text-xs text-ink/70">{formatSize(selectedList.reduce((a, p) => a + p.size, 0))}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setSelected((current) => {
                  const next = new Set(current);
                  for (const p of visible) {
                    if (allVisibleSelected) next.delete(p.name);
                    else next.add(p.name);
                  }
                  return next;
                })
              }
              className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-ink/90 hover:bg-ink/10"
            >
              {allVisibleSelected ? "Desmarcar" : "Marcar todas"}
            </button>
            <button
              type="button"
              onClick={downloadSelected}
              disabled={!selectedList.length || selectedDownload.busy}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-paper px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Baixar
            </button>
          </div>
        </div>
      )}
      {selectedDownload.toast}

      {photo && viewer && (
        <div
          ref={lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de fotos"
          className="fixed inset-0 z-50 flex flex-col bg-void text-white"
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            setTouchX(null);
          }}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 md:px-6">
            <span className="text-sm text-white/70">
              {viewer.index + 1} / {viewer.list.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFavorite(photo.name)}
                aria-pressed={favorites.has(photo.name)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  favorites.has(photo.name) ? "bg-accent text-white" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <HeartIcon filled={favorites.has(photo.name)} className="h-4 w-4" />
                {favorites.has(photo.name) ? "Favorita" : "Favoritar"}
              </button>
              <a href={photo.download} className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink">
                Baixar
              </a>
              <button
                onClick={close}
                aria-label="Fechar"
                className="flex h-10 w-10 items-center justify-center rounded-full text-2xl hover:bg-white/10"
              >
                ×
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            {/* Miniatura (já carregada) no mesmo lugar enquanto a versão grande chega */}
            <div className="absolute inset-x-2 bottom-4 top-0 md:inset-x-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`thumb-${photo.name}`}
                src={photo.thumb}
                alt=""
                className="absolute inset-0 h-full w-full object-contain blur-[2px]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={photo.web}
                ref={markLoaded}
                src={photo.web}
                alt={`Foto ${viewer.index + 1} de ${viewer.list.length}`}
                onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
                className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300 data-loaded:opacity-100"
              />
            </div>
            <button
              onClick={() => step(-1)}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl hover:bg-white/20 md:flex"
            >
              ‹
            </button>
            <button
              onClick={() => step(1)}
              aria-label="Próxima"
              className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl hover:bg-white/20 md:flex"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
