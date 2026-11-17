"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { DEFAULT_CROP, MAX_ZOOM, SCREENS, cropStyle, type CoverCrops, type Crop, type Screen } from "@/lib/coverCrop";
import { setCoverCrop } from "../actions";
import { Icon, btnGhost, btnPrimary } from "../ui";

/**
 * Ajuste do enquadramento da capa: arraste a foto e use o zoom, uma vez para cada tela.
 * A prévia usa o mesmo CSS da página do cliente, então o que aparece aqui é o que o cliente vê.
 */
export default function CoverCropEditor({
  slug,
  src,
  initial,
  onClose,
}: {
  slug: string;
  src: string;
  initial?: CoverCrops;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState<Screen>("desktop");
  const [crops, setCrops] = useState<CoverCrops>(() => ({ ...initial }));
  const [touched, setTouched] = useState<Set<Screen>>(() => new Set(Object.keys(initial ?? {}) as Screen[]));
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const drag = useRef<{ x: number; y: number; crop: Crop } | null>(null);

  const current = crops[screen] ?? DEFAULT_CROP;
  const info = SCREENS.find((s) => s.id === screen)!;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function update(next: Crop) {
    setCrops((c) => ({ ...c, [screen]: next }));
    setTouched((t) => new Set(t).add(screen));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, crop: current };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    const box = stage.current?.getBoundingClientRect();
    if (!start || !box) return;
    // Arrastar a foto para a direita mostra mais do lado esquerdo: o foco anda ao contrário
    const dx = ((e.clientX - start.x) / box.width) * 100 / start.crop.zoom;
    const dy = ((e.clientY - start.y) / box.height) * 100 / start.crop.zoom;
    update({
      ...start.crop,
      x: Math.min(100, Math.max(0, start.crop.x - dx)),
      y: Math.min(100, Math.max(0, start.crop.y - dy)),
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    update({ ...current, x: Math.min(100, Math.max(0, current.x + move[0])), y: Math.min(100, Math.max(0, current.y + move[1])) });
  }

  function save() {
    setError("");
    startSaving(async () => {
      const result = await setCoverCrop(slug, crops);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="ajustar-capa-titulo"
      className="m-auto w-[min(94vw,880px)] overflow-hidden rounded-[28px] bg-adm-surface p-0 text-adm-ink shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="ajustar-capa-titulo" className="text-2xl font-bold tracking-tight">
              Ajustar capa
            </h2>
            <p className="mt-1 text-sm text-adm-muted">Arraste a foto e use o zoom. Cada tela tem o seu enquadramento.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-adm-soft text-adm-ink-2 hover:bg-adm-chip"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div role="tablist" aria-label="Tela" className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-adm-soft p-1">
          {SCREENS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={screen === s.id}
              onClick={() => setScreen(s.id)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                screen === s.id ? "bg-white text-adm-ink shadow-sm" : "text-adm-ink-2 hover:text-adm-ink"
              }`}
            >
              {s.label} <span className="ml-1 text-xs font-medium text-adm-muted">{s.ratioLabel}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid h-[min(46vh,380px)] place-items-center rounded-[22px] bg-[#2b2622] p-4">
          <div
            ref={stage}
            role="group"
            tabIndex={0}
            aria-roledescription="área de enquadramento"
            aria-label={`Enquadramento no ${info.label.toLowerCase()}: arraste a foto ou use as setas do teclado`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={onKeyDown}
            style={{ aspectRatio: info.ratio }}
            className="relative h-full max-w-full cursor-grab touch-none overflow-hidden rounded-xl ring-2 ring-white outline-none select-none focus-visible:ring-4 focus-visible:ring-accent active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} style={cropStyle(current)} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            {/* Linhas dos terços, para ajudar a compor */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className="border-white/40 [&:not(:nth-child(3n))]:border-r [&:nth-child(-n+6)]:border-b" />
              ))}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label htmlFor="zoom-capa" className="text-sm font-medium">
            Zoom
          </label>
          <input
            id="zoom-capa"
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={current.zoom}
            onChange={(e) => update({ ...current, zoom: Number(e.target.value) })}
            className="min-w-[10rem] flex-1 accent-[#e88f4f]"
          />
          <span className="w-12 text-right text-sm tabular-nums text-adm-muted">{Math.round(current.zoom * 100)}%</span>
          <button type="button" onClick={() => update(DEFAULT_CROP)} className={btnGhost}>
            Centralizar
          </button>
        </div>

        <p className="mt-7 text-sm font-medium">Como fica em cada tela</p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          {SCREENS.map((s) => (
            <button key={s.id} type="button" onClick={() => setScreen(s.id)} className="text-left">
              <span
                style={{ aspectRatio: s.ratio }}
                className={`relative block h-28 overflow-hidden rounded-xl transition ${
                  screen === s.id ? "ring-2 ring-accent ring-offset-2" : "ring-1 ring-adm-line hover:ring-adm-line-strong"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={cropStyle(crops[s.id])} className="absolute inset-0 h-full w-full object-cover" />
              </span>
              <span className={`mt-1.5 block text-xs ${screen === s.id ? "font-semibold text-[#b4602a]" : "text-adm-muted"}`}>
                {s.label} · {screen === s.id ? "ajustando" : touched.has(s.id) ? "ajustado" : "centralizado"}
              </span>
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-adm-line bg-adm-soft px-6 py-4 md:px-8">
        <button type="button" onClick={onClose} className={btnGhost}>
          Cancelar
        </button>
        <button type="button" onClick={save} disabled={saving} className={btnPrimary}>
          {saving ? "Salvando..." : "Salvar capa"}
        </button>
      </div>
    </dialog>
  );
}
