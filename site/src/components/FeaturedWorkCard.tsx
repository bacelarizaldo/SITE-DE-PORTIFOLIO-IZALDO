"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/types";
import PlaceholderTag from "./PlaceholderTag";

export default function FeaturedWorkCard({
  project,
  reversed,
  onOpenVideo,
}: {
  project: Project;
  reversed: boolean;
  /** Se informado e o projeto tiver vídeo de capa, o clique abre o vídeo
   * em uma tela por cima em vez de navegar pra página do case. */
  onOpenVideo?: (project: Project) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleEnter() {
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  }

  function handleLeave() {
    setHovered(false);
    videoRef.current?.pause();
  }

  const className = `md:col-span-8 relative aspect-[16/10] overflow-hidden bg-void block group ${
    reversed ? "md:order-2" : ""
  }`;

  const visuals = (
    <>
      <Image
        src={project.thumbnail}
        alt={`${project.title} — ${project.client}`}
        fill
        sizes="(min-width: 768px) 66vw, 100vw"
        className={`object-cover transition-all duration-700 ease-out group-hover:scale-[1.03] ${
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
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-paper/90 text-ink">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 translate-x-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      )}
      {project.placeholder && (
        <PlaceholderTag className="absolute top-4 left-4" />
      )}
    </>
  );

  // Com vídeo de capa e um handler disponível: abre em overlay, sem navegar.
  if (project.coverVideo && onOpenVideo) {
    return (
      <button
        type="button"
        onClick={() => onOpenVideo(project)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        className={`${className} text-left`}
        aria-label={`Assistir vídeo — ${project.title}`}
      >
        {visuals}
      </button>
    );
  }

  // Sem vídeo (ou sem handler): comportamento padrão, navega pro case.
  return (
    <Link
      href={`/portfolio/${project.slug}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      className={className}
    >
      {visuals}
    </Link>
  );
}
