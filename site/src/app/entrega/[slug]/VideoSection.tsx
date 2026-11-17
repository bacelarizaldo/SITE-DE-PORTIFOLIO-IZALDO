"use client";

import { useEffect, useRef, useState } from "react";

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

export default function VideoSection({ videos }: { videos: VideoItem[] }) {
  const [current, setCurrent] = useState(0);
  const video = videos[current];
  const shapes = useVideoShapes(videos);
  const ratio = shapes[video.name];
  const portrait = isPortrait(ratio);
  // Maioria vertical: a lista de vídeos vira uma fileira de cartões em pé, com a capa inteira
  const portraitList = videos.filter((v) => isPortrait(shapes[v.name])).length > videos.length / 2;

  return (
    <section id="filme" className="scroll-mt-16 bg-void px-6 py-12 text-white md:px-10 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">
          {videos.length > 1 ? "Vídeos" : "Vídeo"}
        </p>

        <MobileVideos videos={videos} shapes={shapes} />

        <div className="hidden md:block">
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold md:text-4xl">{video.title}</h2>
            <a
              href={video.download}
              className="rounded-2xl bg-paper px-5 py-3 text-sm font-semibold text-ink transition hover:scale-[1.02]"
            >
              Baixar vídeo · {video.size}
            </a>
          </div>

          {/* Vertical: o player fica em pé, com a altura da tela; horizontal: ocupa a largura toda */}
          <div className="mt-8 flex justify-center">
            <div
              style={{ aspectRatio: ratio === undefined ? LANDSCAPE : clampRatio(ratio) }}
              className={`overflow-hidden rounded-[24px] bg-black shadow-2xl transition-[width,height] duration-300 md:rounded-[32px] ${
                portrait ? "h-[min(78vh,860px)] max-w-full" : "w-full"
              }`}
            >
              <video
                key={video.src}
                // Sem capa enviada, o player mostra o próprio quadro do vídeo.
                // O "#t=0.1" faz Safari exibir esse quadro em vez de tela preta.
                src={video.poster ? video.src : `${video.src}#t=0.1`}
                poster={video.poster}
                controls
                playsInline
                preload={video.poster ? "none" : "metadata"}
                className="h-full w-full bg-black object-contain"
              />
            </div>
          </div>

          {videos.length > 1 && (
            <div
              className={`mt-8 grid items-start gap-4 ${
                portraitList ? "grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {videos.map((v, i) => {
                const active = i === current;
                const shape = shapes[v.name];
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-pressed={active}
                    className="group text-left"
                  >
                    <span
                      style={{ aspectRatio: shape === undefined ? (portraitList ? 9 / 16 : LANDSCAPE) : clampRatio(shape) }}
                      className={`relative block overflow-hidden rounded-2xl bg-white/5 ring-2 transition ${
                        active ? "ring-accent" : "ring-transparent group-hover:ring-white/30"
                      }`}
                    >
                      <Cover video={v} />
                      {active ? (
                        <span className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink">
                          Tocando
                        </span>
                      ) : (
                        <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-ink">
                            <PlayIcon className="ml-0.5 h-5 w-5" />
                          </span>
                        </span>
                      )}
                    </span>
                    <span className={`mt-3 block font-medium leading-snug ${active ? "text-accent" : "text-white"}`}>{v.title}</span>
                    <span className="text-sm text-white/60">{v.size}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
