"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/types";
import { categoryLabels } from "@/content/types";
import PlaceholderTag from "./PlaceholderTag";

export default function ProjectCompactCard({
  project,
  onOpenVideo,
}: {
  project: Project;
  onOpenVideo: (project: Project) => void;
}) {
  const [hovered, setHovered] = useState(false);
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
        sizes="(min-width: 768px) 25vw, 50vw"
        className={`object-cover transition-all duration-500 group-hover:scale-105 ${
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
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper/90 text-ink">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 translate-x-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      )}
      {project.placeholder && <PlaceholderTag className="absolute top-3 left-3" />}
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      {project.coverVideo ? (
        <button
          type="button"
          onClick={() => onOpenVideo(project)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onFocus={handleEnter}
          onBlur={handleLeave}
          aria-label={`Assistir vídeo — ${project.title}`}
          className="group relative aspect-[16/9] w-full overflow-hidden bg-void block text-left"
        >
          {visuals}
        </button>
      ) : (
        <Link
          href={`/portfolio/${project.slug}`}
          className="group relative aspect-[16/9] w-full overflow-hidden bg-void block"
        >
          {visuals}
        </Link>
      )}

      <div>
        <p className="text-[10px] tracking-[0.15em] text-accent uppercase mb-1">
          {project.client || categoryLabels[project.category]}
        </p>
        <Link
          href={`/portfolio/${project.slug}`}
          className="text-sm md:text-base font-bold hover:text-accent transition-colors line-clamp-1"
        >
          {project.title}
        </Link>
      </div>
    </div>
  );
}
