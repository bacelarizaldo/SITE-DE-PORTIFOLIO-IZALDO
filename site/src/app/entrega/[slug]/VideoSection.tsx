"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDialogFocus } from "./useDialogFocus";

export type VideoItem = {
  name: string;
  title: string;
  size: string;
  src: string;
  download: string;
  /** Capa enviada no admin, mostrada antes do play */
  poster?: string;
};

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/** Proporção largura/altura de cada vídeo, descoberta no navegador (undefined enquanto carrega) */
type Shapes = Record<string, number | undefined>;

const LANDSCAPE = 16 / 9;
const isPortrait = (ratio: number | undefined) => ratio !== undefined && ratio < 0.95;
// Limita a proporção exibida: nem mais estreito que 9:16, nem mais largo que 21:9
const clampRatio = (ratio: number | undefined) => Math.min(21 / 9, Math.max(9 / 16, ratio ?? LANDSCAPE));

/**
 * Descobre se cada vídeo é vertical ou horizontal lendo só o cabeçalho do arquivo (preload="metadata"),
 * sem baixar o vídeo. Se o vídeo não abrir (ex.: formato que o navegador não lê), usa a capa.
 */
function useVideoShapes(videos: VideoItem[]): Shapes {
  const [shapes, setShapes] = useState<Shapes>({});

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    for (const item of videos) {
      const done = (ratio: number | undefined) =>
        setShapes((s) => (s[item.name] === ratio ? s : { ...s, [item.name]: ratio }));

      const fromPoster = () => {
        if (!item.poster) return done(LANDSCAPE);
        const img = new Image();
        img.onload = () => done(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : LANDSCAPE);
        img.onerror = () => done(LANDSCAPE);
        img.src = item.poster;
      };

      const probe = document.createElement("video");
      probe.preload = "metadata";
      probe.muted = true;
      probe.onloadedmetadata = () => {
        if (probe.videoWidth && probe.videoHeight) done(probe.videoWidth / probe.videoHeight);
        else fromPoster();
        probe.removeAttribute("src");
        probe.load();
      };
      probe.onerror = fromPoster;
      probe.src = item.src;
      cleanups.push(() => {
        probe.onloadedmetadata = null;
        probe.onerror = null;
        probe.removeAttribute("src");
        probe.load();
      });
    }
    return () => cleanups.forEach((fn) => fn());
  }, [videos]);

  return shapes;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** Capa do vídeo: a enviada no admin ou, sem ela, o primeiro quadro do próprio vídeo */
function Cover({ video }: { video: VideoItem }) {
  return video.poster ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={video.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
  ) : (
    <video
      src={`${video.src}#t=0.1`}
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
    />
  );
}

// No celular: um cartão por vídeo (capa, título e "Assistir"). Ao tocar, o vídeo abre em tela cheia.
// Vídeos verticais ficam dois por linha, em pé; os horizontais ocupam a largura toda.
function MobileVideos({ videos, shapes }: { videos: VideoItem[]; shapes: Shapes }) {
  const player = useRef<FullscreenVideo>(null);
  const [playing, setPlaying] = useState<VideoItem | null>(null);

  function open(video: VideoItem) {
    const el = player.current;
    if (!el) return;
    setPlaying(video);
    el.src = video.src;
    el.play().catch(() => {});
    // Android e navegadores comuns: tela cheia do próprio vídeo; iPhone: player nativo em tela cheia
    if (el.requestFullscreen) el.requestFullscreen().catch(() => el.webkitEnterFullscreen?.());
    else el.webkitEnterFullscreen?.();
  }

  function close() {
    const el = player.current;
    el?.pause();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setPlaying(null);
  }

  // Saiu da tela cheia (botão voltar do Android ou "OK" do iPhone): fecha o player
  useEffect(() => {
    const el = player.current;
    const onExit = () => {
      if (!document.fullscreenElement) {
        el?.pause();
        setPlaying(null);
      }
    };
    document.addEventListener("fullscreenchange", onExit);
    el?.addEventListener("webkitendfullscreen", onExit);
    return () => {
      document.removeEventListener("fullscreenchange", onExit);
      el?.removeEventListener("webkitendfullscreen", onExit);
    };
  }, []);

  return (
    <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 md:hidden">
      {videos.map((v) => {
        const portrait = isPortrait(shapes[v.name]);
        return (
          <div key={v.name} className={portrait ? "col-span-1" : "col-span-2"}>
            <button
              type="button"
              onClick={() => open(v)}
              style={{ aspectRatio: portrait ? clampRatio(shapes[v.name]) : LANDSCAPE }}
              className="relative block w-full overflow-hidden rounded-[20px] bg-white/5 text-left"
            >
              <Cover video={v} />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span className={`absolute bottom-3 ${portrait ? "inset-x-3" : "inset-x-5"}`}>
                <span className={`block font-semibold leading-snug ${portrait ? "text-sm" : "text-lg"}`}>{v.title}</span>
                <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">
                  <PlayIcon className="h-3.5 w-3.5" />
                  Assistir
                </span>
              </span>
            </button>
            <a href={v.download} className="mt-2 inline-block text-sm text-white/70 underline underline-offset-4">
              Baixar · {v.size}
            </a>
          </div>
        );
      })}

      {/* Player único, escondido até abrir em tela cheia */}
      <div
        className={playing ? "fixed inset-0 z-50 flex items-center justify-center bg-black" : "sr-only"}
        aria-hidden={!playing}
      >
        <video
          ref={player}
          controls
          playsInline={false}
          onEnded={close}
          tabIndex={playing ? 0 : -1}
          className="max-h-full w-full"
          aria-label={playing ? playing.title : undefined}
        />
        {playing && (
          <button
            type="button"
            onClick={close}
            aria-label="Fechar vídeo"
            className="absolute right-4 top-4 h-11 w-11 rounded-full bg-white/15 text-2xl text-white"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Vídeo aberto por cima da galeria (computador). Fecha no ×, no Esc ou clicando fora;
 * as setas (na tela ou no teclado) passam para o vídeo anterior e o próximo.
 */
function VideoViewer({
  videos,
  index,
  shapes,
  onClose,
  onStep,
}: {
  videos: VideoItem[];
  index: number;
  shapes: Shapes;
  onClose: () => void;
  onStep: (dir: number) => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const video = videos[index];
  const ratio = shapes[video.name];
  const portrait = isPortrait(ratio);
  useDialogFocus(dialog, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // As setas só trocam de vídeo quando o foco não está nos controles do player (lá elas avançam o tempo)
      if (document.activeElement?.tagName === "VIDEO") return;
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onStep]);

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{video.title}</p>
          {videos.length > 1 && (
            <p className="text-sm text-white/60">
              {index + 1} de {videos.length}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={video.download}
            className="rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:scale-[1.02]"
          >
            Baixar vídeo · {video.size}
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar vídeo"
            className="grid h-11 w-11 place-items-center rounded-full text-3xl leading-none text-white/90 hover:bg-white/10"
          >
            ×
          </button>
        </div>
      </div>

      {/* Clicar no fundo (fora do vídeo) fecha */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-20 pb-8"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <video
          key={video.src}
          src={video.src}
          poster={video.poster}
          controls
          autoPlay
          playsInline
          style={{ aspectRatio: ratio === undefined ? LANDSCAPE : clampRatio(ratio) }}
          className={`max-h-full max-w-full rounded-2xl bg-black object-contain shadow-2xl ${portrait ? "h-full" : "w-full"}`}
        />
        {videos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label="Vídeo anterior"
              className="absolute top-1/2 left-4 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-3xl leading-none hover:bg-white/20"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label="Próximo vídeo"
              className="absolute top-1/2 right-4 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-3xl leading-none hover:bg-white/20"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VideoSection({ videos }: { videos: VideoItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const shapes = useVideoShapes(videos);
  // Maioria vertical: cartões em pé, mais por linha, com a capa inteira
  const portraitList = videos.filter((v) => isPortrait(shapes[v.name])).length > videos.length / 2;
  const single = videos.length === 1;

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir: number) => setOpen((i) => (i === null ? i : (i + dir + videos.length) % videos.length)),
    [videos.length]
  );

  // Colunas conforme a quantidade: poucos vídeos ficam maiores e centralizados.
  // Em pé cabem até 5 por linha (cada um com até 280 px); deitados, até 3.
  const cols = Math.min(videos.length, portraitList ? 5 : 3);
  const maxWidth = portraitList ? `${cols * 280}px` : single ? "56rem" : undefined;

  return (
    <section id="filme" className="scroll-mt-16 bg-void px-6 py-12 text-white md:px-10 lg:py-20">
      {/* No computador, título e galeria ocupam a mesma largura, centralizados */}
      <div className="mx-auto max-w-6xl md:[max-width:var(--video-max)]" style={{ "--video-max": maxWidth ?? "72rem" } as React.CSSProperties}>
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">{single ? "Vídeo" : "Vídeos"}</p>
        <h2 className="mt-3 hidden text-3xl font-semibold md:block md:text-4xl">
          {single ? videos[0].title : `${videos.length} vídeos`}
        </h2>

        <MobileVideos videos={videos} shapes={shapes} />

        {/* Computador: galeria de cartões no formato de cada vídeo; o clique abre o vídeo por cima */}
        <div
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          className="mt-8 hidden items-start gap-x-4 gap-y-8 md:grid"
        >
          {videos.map((v, i) => {
            const shape = shapes[v.name];
            return (
              <div key={v.name}>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`Assistir ${v.title}`}
                  className="group block w-full text-left"
                >
                  <span
                    style={{ aspectRatio: shape === undefined ? (portraitList ? 9 / 16 : LANDSCAPE) : clampRatio(shape) }}
                    className="relative block overflow-hidden rounded-2xl bg-white/5 ring-2 ring-transparent transition group-hover:ring-white/30 group-focus-visible:ring-accent"
                  >
                    <Cover video={v} />
                    <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-ink">
                        <PlayIcon className="ml-0.5 h-6 w-6" />
                      </span>
                    </span>
                  </span>
                  {!single && <span className="mt-3 block font-medium leading-snug text-white">{v.title}</span>}
                </button>
                <a href={v.download} className="mt-1 inline-block text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">
                  Baixar · {v.size}
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {open !== null && <VideoViewer videos={videos} index={open} shapes={shapes} onClose={close} onStep={step} />}
    </section>
  );
}
