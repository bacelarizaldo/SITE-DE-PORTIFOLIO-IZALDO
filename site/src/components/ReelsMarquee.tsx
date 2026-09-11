"use client";

import { useState } from "react";
import type { Reel } from "@/content/reels";
import SectionReveal from "./SectionReveal";
import ReelCard from "./ReelCard";
import ReelLightbox from "./ReelLightbox";

export default function ReelsMarquee({ reels }: { reels: Reel[] }) {
  const [active, setActive] = useState<Reel | null>(null);

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
          <ReelCard
            key={`${reel.id}-${i}`}
            reel={reel}
            onOpen={setActive}
            className="w-[190px] md:w-[240px] shrink-0"
          />
        ))}
      </div>

      <ReelLightbox reel={active} onClose={() => setActive(null)} />
    </section>
  );
}
