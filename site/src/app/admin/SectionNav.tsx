"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "./ui";

export type NavSection = { id: string; label: string; icon: IconName; badge?: string };

// Menu das seções da entrega: marca a seção que está na tela enquanto a página rola.
// No computador fica na barra lateral; no celular, numa faixa fixa no topo que rola de lado.
export default function SectionNav({ sections, variant }: { sections: NavSection[]; variant: "side" | "top" }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => Boolean(el));
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        // A primeira seção (na ordem da página) que aparece na faixa de leitura
        const first = sections.find((s) => (visible.get(s.id) ?? 0) > 0);
        if (first) setActive(first.id);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: [0, 0.01, 0.5, 1] }
    );
    els.forEach((el) => observer.observe(el));
    // No fim da página a última seção não chega à faixa de leitura: marca ela ao bater no fundo
    const atBottom = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setActive(sections[sections.length - 1]?.id);
      }
    };
    window.addEventListener("scroll", atBottom, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", atBottom);
    };
  }, [sections]);

  // No celular, mantém a pílula ativa à vista
  useEffect(() => {
    if (variant !== "top" || !active) return;
    document.getElementById(`nav-top-${active}`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active, variant]);

  if (variant === "top") {
    return (
      <nav aria-label="Seções da entrega" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
        <ul className="flex gap-2 py-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                id={`nav-top-${s.id}`}
                href={`#${s.id}`}
                aria-current={active === s.id ? "true" : undefined}
                className={`inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition ${
                  active === s.id ? "bg-adm-ink text-white" : "bg-adm-surface text-adm-ink-2 ring-1 ring-adm-line"
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Seções da entrega">
      <ul className="grid gap-0.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "true" : undefined}
              title={s.label}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-[15px] transition group-data-[collapsed]/aside:justify-center ${
                active === s.id ? "bg-adm-ink text-white" : "text-adm-ink-2 hover:bg-adm-soft"
              }`}
            >
              <Icon name={s.icon} className="h-[18px] w-[18px] shrink-0" />
              <span className="min-w-0 flex-1 truncate group-data-[collapsed]/aside:hidden">{s.label}</span>
              {s.badge && (
                <span className={`text-xs tabular-nums group-data-[collapsed]/aside:hidden ${active === s.id ? "text-white/70" : "text-adm-muted"}`}>
                  {s.badge}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
