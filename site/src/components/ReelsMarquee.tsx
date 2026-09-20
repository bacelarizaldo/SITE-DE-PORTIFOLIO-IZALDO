"use client";

import { useState } from "react";
import Link from "next/link";
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
        <SectionReveal className="mb-12 md:mb-16 flex items-baseline justify-between gap-4 md:gap-6">
          <div className="flex items-baseline gap-4 md:gap-6">
            <span className="text-sm text-accent tracking-[0.2em]">02</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Reels & <span className="text-mist">conteúdo para redes.</span>
            </h2>
          </div>
          <Link
            href="/portfolio"
            className="hidden md:inline-block text-sm text-mist hover:text-paper transition-colors shrink-0"
          >
            Ver todos →
          </Link>
        </SectionReveal>
      </div>

      <div className="marquee-track flex w-max gap-4 md:gap-6 px-6 md:px-10">
        {track.map((reel, i) => (
          <ReelCard
            key={`${reel.id}-${i}`}
            reel={reel}
            onOpen={setActive}
            className="w-[190px] md:w-[340px] shrink-0"
          />
        ))}
      </div>

      <ReelLightbox reel={active} onClose={() => setActive(null)} />
    </section>
  );
}
