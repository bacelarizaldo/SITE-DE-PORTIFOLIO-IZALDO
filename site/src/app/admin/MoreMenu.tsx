"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui";

/** Item do menu: mesma aparência para botões e para o ConfirmButton dentro de um form */
export const menuItem =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-adm-ink transition hover:bg-adm-soft disabled:opacity-50";
export const menuItemDanger =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-50";

// Botão "⋯" com ações menos usadas (renomear, excluir tudo...), para não poluir a tela.
export default function MoreMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className={`grid h-9 w-9 place-items-center rounded-full transition ${
          open ? "bg-adm-ink text-white" : "text-adm-ink-2 hover:bg-adm-soft"
        }`}
      >
        <Icon name="more" className="h-5 w-5 [stroke-width:3]" />
      </button>
      {open && (
        <div
          role="menu"
          // Fecha depois do clique: fechar na hora tiraria o form da página antes de ele ser enviado
          onClick={() => setTimeout(() => setOpen(false), 0)}
          className="absolute top-11 right-0 z-20 grid min-w-56 gap-0.5 rounded-2xl bg-adm-surface p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.14)] ring-1 ring-adm-line"
        >
          {children}
        </div>
      )}
    </div>
  );
}
