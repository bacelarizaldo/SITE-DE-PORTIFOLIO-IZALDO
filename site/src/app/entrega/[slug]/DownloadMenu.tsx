"use client";

import { useEffect, useRef, useState } from "react";
import { UNSUPPORTED, canZip, prepareZip, startZip, type ZipFile } from "./zipDownload";

export type DownloadOption =
  | { kind: "zip"; label: string; detail: string; filename: string; files: ZipFile[] }
  | { kind: "link"; label: string; detail: string; href: string };

type Status = { text: string; tone: "info" | "ok" | "error" } | null;

export function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}

/** Baixa um pacote .zip mostrando o andamento num aviso no rodapé da tela. */
export function useZipDownload() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  async function download(option: Extract<DownloadOption, { kind: "zip" }>) {
    if (!canZip()) {
      setStatus({ text: UNSUPPORTED, tone: "error" });
      return;
    }
    setBusy(true);
    setStatus({ text: "Preparando o download...", tone: "info" });
    try {
      await startZip(option.files, option.filename, {
        onProgress: (done, total) =>
          setStatus({ text: `Baixando: ${done} de ${total} arquivos. Mantenha esta página aberta.`, tone: "info" }),
        onDone: () => {
          setBusy(false);
          setStatus({ text: "Download concluído! Confira a pasta de downloads.", tone: "ok" });
        },
        onError: (message) => {
          setBusy(false);
          setStatus({ text: `O download parou: ${message}. Tente de novo.`, tone: "error" });
        },
      });
    } catch (err) {
      setBusy(false);
      setStatus({ text: (err as Error).message, tone: "error" });
    }
  }

  const toast = status && (
    <div
      role="status"
      className={`fixed bottom-4 left-1/2 z-50 flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-xl ${
        status.tone === "error" ? "bg-red-700 text-white" : status.tone === "ok" ? "bg-[#2f6f3e] text-white" : "bg-accent text-ink"
      }`}
    >
      <span className="flex-1">{status.text}</span>
      {!busy && (
        <button type="button" onClick={() => setStatus(null)} aria-label="Fechar aviso" className="text-white/80 hover:text-white">
          ×
        </button>
      )}
    </div>
  );

  return { busy, download, toast };
}

export default function DownloadMenu({ options }: { options: DownloadOption[] }) {
  const [open, setOpen] = useState(false);
  const { busy, download: startDownload, toast } = useZipDownload();
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => prepareZip(), []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    // Esc fecha o menu e devolve o foco ao botão
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function download(option: Extract<DownloadOption, { kind: "zip" }>) {
    setOpen(false);
    startDownload(option);
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="menu-baixar"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#f0a46c] disabled:opacity-70"
      >
        <DownloadIcon className="h-4 w-4" />
        <span>{busy ? "Baixando..." : "Baixar"}</span>
      </button>

      {open && (
        <div id="menu-baixar" className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-[#0c1d28] py-1 shadow-xl">
          {options.map((option) =>
            option.kind === "zip" ? (
              <button
                key={option.label}
                type="button"
                onClick={() => download(option)}
                className="block w-full px-4 py-3 text-left hover:bg-ink"
              >
                <span className="block text-sm font-medium text-paper">{option.label}</span>
                <span className="text-xs text-mist">{option.detail}</span>
              </button>
            ) : (
              <a key={option.label} href={option.href} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-ink">
                <span className="block text-sm font-medium text-paper">{option.label}</span>
                <span className="text-xs text-mist">{option.detail}</span>
              </a>
            )
          )}
        </div>
      )}

      {toast}
    </div>
  );
}
