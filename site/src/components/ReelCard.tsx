import Image from "next/image";
import type { Reel } from "@/content/reels";

export default function ReelCard({
  reel,
  onOpen,
  className = "",
  sizes = "240px",
}: {
  reel: Reel;
  onOpen: (reel: Reel) => void;
  className?: string;
  sizes?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(reel)}
      aria-label={reel.caption ? `Assistir: ${reel.caption}` : "Assistir vídeo"}
      className={`group relative aspect-[9/16] overflow-hidden bg-void ${className}`}
    >
      {reel.thumbnail ? (
        <Image
          src={reel.thumbnail}
          alt={reel.caption || ""}
          fill
          sizes={sizes}
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
