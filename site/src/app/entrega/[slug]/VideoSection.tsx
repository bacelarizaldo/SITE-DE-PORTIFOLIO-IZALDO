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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

// No celular: um cartão por vídeo (capa, título e "Assistir"). Ao tocar, o vídeo abre em tela cheia.
function MobileVideos({ videos }: { videos: VideoItem[] }) {
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
    <div className="mt-8 grid gap-6 md:hidden">
      {videos.map((v) => (
        <div key={v.name}>
          <button
            type="button"
            onClick={() => open(v)}
            className="relative block aspect-video w-full overflow-hidden rounded-[20px] bg-black text-left"
          >
            {v.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              // Sem capa: o primeiro quadro do vídeo, parado
              <video
                src={`${v.src}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
                tabIndex={-1}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <span className="absolute inset-x-5 bottom-4">
              <span className="block text-lg font-semibold leading-snug">{v.title}</span>
              <span className="mt-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
                <PlayIcon className="h-4 w-4" />
                Assistir
              </span>
            </span>
          </button>
          <a href={v.download} className="mt-2 inline-block text-sm text-white/70 underline underline-offset-4">
            Baixar · {v.size}
          </a>
        </div>
      ))}

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

  return (
    <section id="filme" className="scroll-mt-16 bg-void px-6 py-12 text-white md:px-10 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">
          {videos.length > 1 ? "Vídeos" : "Vídeo"}
        </p>

        <MobileVideos videos={videos} />

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

          <div className="mt-8 overflow-hidden rounded-[24px] bg-black shadow-2xl md:rounded-[32px]">
            <video
              key={video.src}
              // Sem capa enviada, o player mostra o próprio quadro do vídeo.
              // O "#t=0.1" faz Safari exibir esse quadro em vez de tela preta.
              src={video.poster ? video.src : `${video.src}#t=0.1`}
              poster={video.poster}
              controls
              playsInline
              preload={video.poster ? "none" : "metadata"}
              className="aspect-video w-full bg-black"
            />
          </div>

          {videos.length > 1 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v, i) => (
                <button
                  key={v.name}
                  onClick={() => setCurrent(i)}
                  className={`rounded-2xl border px-5 py-4 text-left transition ${
                    i === current
                      ? "border-paper bg-paper text-ink"
                      : "border-white/15 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {v.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.poster} alt="" loading="lazy" className="mb-3 aspect-video w-full rounded-lg object-cover" />
                  )}
                  <span className="block font-medium">{v.title}</span>
                  <span className={`text-sm ${i === current ? "text-mist" : "text-white/60"}`}>
                    {v.size}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
