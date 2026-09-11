"use client";

import { useState } from "react";
import type { Reel } from "@/content/reels";
import ReelCard from "./ReelCard";
import ReelLightbox from "./ReelLightbox";

export default function ReelsPortfolioGrid({ reels }: { reels: Reel[] }) {
  const [active, setActive] = useState<Reel | null>(null);

  if (reels.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-5">
        {reels.map((reel) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            onOpen={setActive}
            sizes="(min-width: 768px) 20vw, (min-width: 640px) 33vw, 50vw"
          />
        ))}
      </div>

      <ReelLightbox reel={active} onClose={() => setActive(null)} />
    </div>
  );
}
