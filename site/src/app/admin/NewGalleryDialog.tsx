"use client";

import { useEffect, useRef } from "react";
import { CreateGalleryForm } from "./forms";
import { Icon, btnPrimary } from "./ui";

// "Nova entrega" abre numa janela por cima do painel. O link /admin#nova (menu lateral) também abre.
export default function NewGalleryDialog() {
  const ref = useRef<HTMLDialogElement>(null);

  const open = () => {
    if (!ref.current?.open) ref.current?.showModal();
  };
  const close = () => {
    ref.current?.close();
    if (location.hash === "#nova") history.replaceState(null, "", location.pathname + location.search);
  };

  useEffect(() => {
    const fromHash = () => location.hash === "#nova" && open();
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  return (
    <>
      <button type="button" onClick={open} className={btnPrimary}>
        <Icon name="plus" className="h-4 w-4" />
        Nova entrega
      </button>
      <dialog
        ref={ref}
        aria-labelledby="nova-galeria-titulo"
        onClose={() => location.hash === "#nova" && history.replaceState(null, "", location.pathname)}
        onClick={(e) => e.target === ref.current && close()}
        className="m-auto w-[min(92vw,460px)] rounded-[28px] bg-adm-surface p-0 text-adm-ink shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 md:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="nova-galeria-titulo" className="text-xl font-semibold">
                Nova entrega
              </h2>
              <p className="mt-1 text-sm text-adm-muted">Depois de criar, você envia vídeos e fotos na página dela.</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Fechar"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-adm-muted hover:bg-adm-soft"
            >
              <Icon name="plus" className="h-5 w-5 rotate-45" />
            </button>
          </div>
          <CreateGalleryForm onCancel={close} />
        </div>
      </dialog>
    </>
  );
}
