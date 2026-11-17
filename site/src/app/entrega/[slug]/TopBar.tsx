"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Barra que aparece fixa no topo depois que a capa sai da tela
export default function TopBar({
  title,
  slug,
  admin,
  children,
}: {
  title: string;
  slug: string;
  admin: boolean;
  children?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("capa");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: "-64px 0px 0px 0px",
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 border-b border-line bg-ink/90 backdrop-blur transition duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium uppercase tracking-[0.12em] text-paper md:text-base">{title}</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-mist">IB Films</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {children}
          {admin && (
            <Link href={`/admin/${slug}`} className="hidden text-sm text-mist hover:underline sm:block">
              Admin
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
