"use client";

import { useEffect } from "react";
import type { Reel } from "@/content/reels";

export default function ReelLightbox({
  reel,
  onClose,
}: {
  reel: Reel | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!reel) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [reel, onClose]);

  if (!reel) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-void/95 p-4 md:p-10"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-5 right-5 md:top-8 md:right-8 text-paper/70 hover:text-paper text-3xl leading-none"
      >
        ×
      </button>
      <video
        src={reel.video}
        controls
        autoPlay
        playsInline
        className="max-h-full max-w-full aspect-[9/16] h-[85vh] bg-black"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
