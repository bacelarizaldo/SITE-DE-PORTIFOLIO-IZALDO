import type { CSSProperties } from "react";

// Enquadramento da capa da entrega, um para cada tamanho de tela. A capa abre em tela cheia,
// então o mesmo arquivo é cortado de jeitos diferentes no computador, no tablet e no celular.
// x e y: ponto da foto que fica no centro do recorte (0 a 100%); zoom: 1 = sem aproximar.

export type Crop = { x: number; y: number; zoom: number };
export type Screen = "desktop" | "tablet" | "mobile";
export type CoverCrops = Partial<Record<Screen, Crop>>;

export const SCREENS: { id: Screen; label: string; ratio: number; ratioLabel: string }[] = [
  { id: "desktop", label: "Computador", ratio: 16 / 10, ratioLabel: "16:10" },
  { id: "tablet", label: "Tablet", ratio: 3 / 4, ratioLabel: "3:4" },
  { id: "mobile", label: "Celular", ratio: 9 / 19, ratioLabel: "9:19" },
];

export const DEFAULT_CROP: Crop = { x: 50, y: 50, zoom: 1 };
export const MAX_ZOOM = 3;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Garante valores válidos (vindos do formulário ou de dados antigos). */
export function normalizeCrop(value: unknown): Crop | undefined {
  if (!value || typeof value !== "object") return undefined;
  const { x, y, zoom } = value as Record<string, unknown>;
  if (![x, y, zoom].every((n) => typeof n === "number" && Number.isFinite(n))) return undefined;
  return {
    x: Math.round(clamp(x as number, 0, 100) * 10) / 10,
    y: Math.round(clamp(y as number, 0, 100) * 10) / 10,
    zoom: Math.round(clamp(zoom as number, 1, MAX_ZOOM) * 100) / 100,
  };
}

/**
 * Estilo da <img> (com object-cover) para mostrar o recorte: o ponto x/y fica em foco e o zoom
 * aproxima em volta dele. O editor usa o mesmo estilo, então a prévia é igual ao resultado.
 */
export function cropStyle(crop: Crop | undefined): CSSProperties {
  const c = crop ?? DEFAULT_CROP;
  return {
    objectPosition: `${c.x}% ${c.y}%`,
    transform: c.zoom > 1 ? `scale(${c.zoom})` : undefined,
    transformOrigin: `${c.x}% ${c.y}%`,
  };
}
