"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Project } from "@/content/types";

export default function ProjectVideoModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!project) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  if (!project || !project.coverVideo) return null;

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

      <div
        className="flex flex-col items-center gap-5 max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          src={project.coverVideo}
          controls
          autoPlay
          playsInline
          className="max-h-[75vh] w-full bg-black"
        />
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-center md:text-left">
          <div>
            <p className="text-sm font-bold text-paper">{project.title}</p>
            {project.client && (
              <p className="text-xs text-mist">{project.client}</p>
            )}
          </div>
          <Link
            href={`/portfolio/${project.slug}`}
            className="text-sm text-accent hover:text-paper transition-colors shrink-0"
          >
            Ver case completo →
          </Link>
        </div>
      </div>
    </div>
  );
}
