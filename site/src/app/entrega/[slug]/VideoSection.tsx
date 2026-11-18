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
  /** Link para baixar a capa do vídeo como arquivo */
  coverDownload?: string;
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

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  );
}

function VolumeIcon({ muted, className }: { muted: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 10v4h4l5 4V6L8 10z" fill="currentColor" />
      {muted ? <path d="M17 9l4 6M21 9l-4 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
    </svg>
  );
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
    </svg>
  );
}

const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/**
 * Cartão de um vídeo: capa no formato do vídeo, título e tamanho por cima, no rodapé,
 * e um botão redondo para baixar só esse vídeo. Tocar no resto do cartão abre o vídeo.
 */
function VideoCard({
  video,
  shape,
  fallbackPortrait,
  onOpen,
}: {
  video: VideoItem;
  shape: number | undefined;
  fallbackPortrait: boolean;
  onOpen: () => void;
}) {
  const portrait = shape === undefined ? fallbackPortrait : isPortrait(shape);
  return (
    <div
      style={{ aspectRatio: shape === undefined ? (fallbackPortrait ? 9 / 16 : LANDSCAPE) : clampRatio(shape) }}
      className="group relative overflow-hidden rounded-[20px] bg-white/5 ring-1 ring-white/10 transition hover:ring-2 hover:ring-white/40"
    >
      <Cover video={video} />
      <button type="button" onClick={onOpen} aria-label={`Assistir ${video.title}`} className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent">
        <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-ink">
            <PlayIcon className="ml-0.5 h-6 w-6" />
          </span>
        </span>
      </button>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2 ${portrait ? "p-3" : "p-4"}`}>
        <div className="min-w-0 flex-1">
          <p className={`truncate font-semibold leading-snug text-white ${portrait ? "text-[15px]" : "text-lg"}`}>{video.title}</p>
          <p className="text-[13px] text-white/70">{video.size}</p>
        </div>
        <a
          href={video.download}
          aria-label={`Baixar ${video.title} (${video.size})`}
          title={`Baixar · ${video.size}`}
          className="pointer-events-auto grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white hover:text-ink"
        >
          <DownloadIcon className="h-[18px] w-[18px]" />
        </a>
      </div>
    </div>
  );
}

/**
 * Player com controles próprios: barra flutuante com play, tempo, progresso (laranja da marca),
 * som e tela cheia. Os controles somem sozinhos enquanto o vídeo toca e voltam ao mexer o mouse.
 */
function Player({ video, ratio }: { video: VideoItem; ratio: number | undefined }) {
  const box = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portrait = isPortrait(ratio);

  const wake = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2500);
  }, []);

  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  const toggle = () => {
    const v = el.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const fullscreen = () => {
    const target = box.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (target?.requestFullscreen) target.requestFullscreen().catch(() => {});
    else (el.current as FullscreenVideo | null)?.webkitEnterFullscreen?.();
  };

  const showControls = !playing || !idle;
  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div
      ref={box}
      onMouseMove={wake}
      style={{ aspectRatio: ratio === undefined ? LANDSCAPE : clampRatio(ratio) }}
      className={`group/player relative max-h-full max-w-full overflow-hidden rounded-[22px] bg-black shadow-2xl ${
        portrait ? "h-full" : "w-full"
      } ${showControls ? "" : "cursor-none"}`}
    >
      <video
        ref={el}
        key={video.src}
        src={video.src}
        poster={video.poster}
        autoPlay
        playsInline
        onClick={toggle}
        onPlay={() => {
          setPlaying(true);
          wake();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        aria-label={video.title}
        className="h-full w-full object-contain"
      />

      <div
        className={`absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-black/55 px-3 py-2.5 text-white ring-1 ring-white/10 backdrop-blur-md transition-opacity duration-300 ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Tocar"}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink transition hover:scale-105"
        >
          {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="ml-0.5 h-4 w-4" />}
        </button>
        <span className="shrink-0 text-sm font-semibold tabular-nums">{clock(time)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step="any"
          value={time}
          onChange={(e) => {
            const v = el.current;
            if (v) v.currentTime = Number(e.target.value);
            setTime(Number(e.target.value));
          }}
          aria-label="Posição do vídeo"
          aria-valuetext={`${clock(time)} de ${clock(duration)}`}
          style={{ background: `linear-gradient(to right, #e88f4f ${pct}%, rgba(255,255,255,0.25) ${pct}%)` }}
          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
        />
        {!portrait && <span className="shrink-0 text-sm tabular-nums text-white/60">{clock(duration)}</span>}
        <button
          type="button"
          onClick={() => {
            const v = el.current;
            if (v) v.muted = !v.muted;
          }}
          aria-label={muted ? "Ligar o som" : "Tirar o som"}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 hover:bg-white/10"
        >
          <VolumeIcon muted={muted} className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={fullscreen}
          aria-label="Tela cheia"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 hover:bg-white/10"
        >
          <FullscreenIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// No celular: os mesmos cartões. Ao tocar, o vídeo abre em tela cheia no player do próprio aparelho.
// Vídeos verticais ficam dois por linha, em pé; os horizontais ocupam a largura toda.
function MobileVideos({ videos, shapes, portraitList }: { videos: VideoItem[]; shapes: Shapes; portraitList: boolean }) {
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
    <div className="mt-8 grid grid-cols-2 gap-3 md:hidden">
      {videos.map((v) => {
        const shape = shapes[v.name];
        const portrait = shape === undefined ? portraitList : isPortrait(shape);
        return (
          <div key={v.name} className={portrait ? "col-span-1" : "col-span-2"}>
            <VideoCard video={v} shape={shape} fallbackPortrait={portraitList} onOpen={() => open(v)} />
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
 * Vídeo aberto por cima da galeria (computador): o player no centro e, embaixo, as miniaturas
 * de todos os vídeos para trocar. Fecha no ×, no Esc ou clicando no fundo; as setas do teclado
 * passam para o anterior e o próximo.
 */
function VideoViewer({
  videos,
  index,
  shapes,
  onClose,
  onSelect,
}: {
  videos: VideoItem[];
  index: number;
  shapes: Shapes;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const video = videos[index];
  useDialogFocus(dialog, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Na barra de progresso as setas avançam o tempo; fora dela, trocam de vídeo
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "ArrowRight") onSelect((index + 1) % videos.length);
      if (e.key === "ArrowLeft") onSelect((index - 1 + videos.length) % videos.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onSelect, index, videos.length]);

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <p className="min-w-0 truncate text-lg font-semibold">{video.title}</p>
        <div className="flex shrink-0 items-center gap-2">
          {video.coverDownload && (
            <a
              href={video.coverDownload}
              aria-label={`Baixar a capa de ${video.title}`}
              title="Baixar a capa"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/10"
            >
              <DownloadIcon className="h-4 w-4" />
              Capa
            </a>
          )}
          <a
            href={video.download}
            className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:scale-[1.02]"
          >
            <DownloadIcon className="h-4 w-4" />
            Baixar · {video.size}
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
        className="flex min-h-0 flex-1 items-center justify-center px-6 md:px-16"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <Player key={video.src} video={video} ratio={shapes[video.name]} />
      </div>

      {videos.length > 1 ? (
        <div className="flex justify-center gap-2 px-6 pt-4 pb-6" role="group" aria-label="Escolher vídeo">
          {videos.map((v, i) => (
            <button
              key={v.name}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={v.title}
              aria-current={i === index ? "true" : undefined}
              style={{ aspectRatio: clampRatio(shapes[v.name]) }}
              className={`relative h-16 overflow-hidden rounded-lg transition ${
                i === index ? "ring-2 ring-white" : "opacity-50 ring-1 ring-white/20 hover:opacity-90"
              }`}
            >
              <Cover video={v} />
            </button>
          ))}
        </div>
      ) : (
        <div className="h-6" />
      )}
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

        <MobileVideos videos={videos} shapes={shapes} portraitList={portraitList} />

        {/* Computador: galeria de cartões no formato de cada vídeo; o clique abre o vídeo por cima */}
        <div
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          className="mt-8 hidden items-start gap-4 md:grid"
        >
          {videos.map((v, i) => (
            <VideoCard key={v.name} video={v} shape={shapes[v.name]} fallbackPortrait={portraitList} onOpen={() => setOpen(i)} />
          ))}
        </div>
      </div>

      {open !== null && <VideoViewer videos={videos} index={open} shapes={shapes} onClose={close} onSelect={setOpen} />}
    </section>
  );
}
