"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Reel } from "@/content/reels";
import SectionReveal from "./SectionReveal";

function ReelCard({ reel, onOpen }: { reel: Reel; onOpen: (reel: Reel) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(reel)}
      aria-label={reel.caption ? `Assistir: ${reel.caption}` : "Assistir vídeo"}
      className="group relative w-[190px] md:w-[240px] aspect-[9/16] shrink-0 overflow-hidden bg-void"
    >
      {reel.thumbnail ? (
        <Image
          src={reel.thumbnail}
          alt={reel.caption || ""}
          fill
          sizes="240px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <video
          src={reel.video}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-transparent" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper/90 text-ink transition-transform group-hover:scale-110">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 translate-x-0.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      {reel.caption && (
        <span className="absolute bottom-3 left-3 right-3 text-left text-xs text-paper/90 line-clamp-2">
          {reel.caption}
        </span>
      )}
    </button>
  );
}

export default function ReelsMarquee({ reels }: { reels: Reel[] }) {
  const [active, setActive] = useState<Reel | null>(null);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  if (reels.length === 0) return null;

  // Duplica a lista pra criar o loop contínuo sem "salto" no fim.
  const track = [...reels, ...reels];

  return (
    <section className="bg-void py-24 md:py-36 border-y border-line overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <SectionReveal className="mb-12 md:mb-16 flex items-baseline gap-4 md:gap-6">
          <span className="text-sm text-accent tracking-[0.2em]">02</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Últimos <span className="text-mist">vídeos.</span>
          </h2>
        </SectionReveal>
      </div>

      <div className="marquee-track flex w-max gap-4 md:gap-6 px-6 md:px-10">
        {track.map((reel, i) => (
          <ReelCard key={`${reel.id}-${i}`} reel={reel} onOpen={setActive} />
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-void/95 p-4 md:p-10"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Fechar"
            className="absolute top-5 right-5 md:top-8 md:right-8 text-paper/70 hover:text-paper text-3xl leading-none"
          >
            ×
          </button>
          <video
            src={active.video}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full aspect-[9/16] h-[85vh] bg-black"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
