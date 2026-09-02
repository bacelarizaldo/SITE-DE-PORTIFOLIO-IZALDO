"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { Project } from "@/content/types";
import PlaceholderTag from "./PlaceholderTag";
import ProjectVideoModal from "./ProjectVideoModal";

// Capa da página do case. Se o projeto tiver vídeo de capa, funciona igual
// aos outros pontos do site: preview no hover e clique abre o vídeo em
// tela por cima (sem sair da página).
export default function ProjectHeroMedia({ project }: { project: Project }) {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleEnter() {
    if (!project.coverVideo) return;
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  }

  function handleLeave() {
    setHovered(false);
    videoRef.current?.pause();
  }

  const visuals = (
    <>
      <Image
        src={project.thumbnail}
        alt={`${project.title} — ${project.client}`}
        fill
        sizes="100vw"
        priority
        className={`object-cover transition-opacity duration-500 ${
          project.coverVideo && hovered ? "opacity-0" : "opacity-100"
        }`}
      />
      {project.coverVideo && (
        <video
          ref={videoRef}
          src={project.coverVideo}
          muted
          loop
          playsInline
          preload="none"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {project.coverVideo && (
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-paper/90 text-ink">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 translate-x-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      )}
      {project.placeholder && <PlaceholderTag className="absolute top-6 left-6" />}
    </>
  );

  if (!project.coverVideo) {
    return (
      <div className="relative mt-12 md:mt-16 aspect-[16/9] w-full bg-void">
        {visuals}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        aria-label={`Assistir vídeo — ${project.title}`}
        className="group relative mt-12 md:mt-16 aspect-[16/9] w-full bg-void block text-left"
      >
        {visuals}
      </button>
      <ProjectVideoModal project={open ? project : null} onClose={() => setOpen(false)} />
    </>
  );
}
