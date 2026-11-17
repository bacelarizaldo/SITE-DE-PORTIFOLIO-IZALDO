"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, Pill } from "./ui";

export type GalleryRow = {
  slug: string;
  title: string;
  dateLabel: string;
  createdLabel: string;
  /** Para ordenar: data da gravação (ou da criação) em ISO */
  sortDate: string;
  photos: number;
  videos: number;
  downloads: number;
  favorites: number;
  bytes: number;
  sizeLabel: string;
  thumb?: string;
  /** Recados que chegaram depois da última leitura */
  newFeedback: number;
  noCode: boolean;
  overAYear: boolean;
};

type Filter = "todas" | "atencao" | "vazias";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const isEmpty = (g: GalleryRow) => g.photos + g.videos + g.downloads === 0;
const needsAttention = (g: GalleryRow) => g.newFeedback > 0 || g.noCode || g.overAYear;

function Status({ g }: { g: GalleryRow }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {g.newFeedback > 0 && (
        <Pill tone="dark">
          <Icon name="inbox" className="h-3 w-3" />
          {plural(g.newFeedback, "recado novo", "recados novos")}
        </Pill>
      )}
      {g.noCode && <Pill tone="warn">Link sem código</Pill>}
      {g.overAYear && <Pill tone="warn">Mais de 1 ano</Pill>}
      {isEmpty(g) && <Pill>Vazia</Pill>}
      {!needsAttention(g) && !isEmpty(g) && (
        <Pill tone="ok">
          <Icon name="check" className="h-3 w-3" />
          Em dia
        </Pill>
      )}
    </span>
  );
}

function Thumb({ g }: { g: GalleryRow }) {
  return g.thumb ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={g.thumb} alt="" loading="lazy" className="h-12 w-16 shrink-0 rounded-xl object-cover" />
  ) : (
    <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-adm-soft text-adm-muted">
      <Icon name="image" className="h-5 w-5" />
    </span>
  );
}

export default function GalleryTable({ rows }: { rows: GalleryRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");

  const counts = useMemo(
    () => ({ todas: rows.length, atencao: rows.filter(needsAttention).length, vazias: rows.filter(isEmpty).length }),
    [rows]
  );

  const visible = useMemo(() => {
    const q = query
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
    return rows.filter((g) => {
      if (filter === "atencao" && !needsAttention(g)) return false;
      if (filter === "vazias" && !isEmpty(g)) return false;
      if (!q) return true;
      const hay = `${g.title} ${g.slug}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "atencao", label: "Precisam de atenção" },
    { id: "vazias", label: "Vazias" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filtrar entregas" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
                filter === f.id ? "bg-adm-pill text-white" : "bg-adm-surface text-adm-ink-2 ring-1 ring-adm-line hover:ring-adm-line-strong"
              }`}
            >
              {f.label}
              <span className={`tabular-nums ${filter === f.id ? "text-white/75" : "text-adm-muted"}`}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">Buscar entrega</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-adm-muted" />
          <input
            id="buscar-galeria"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente ou projeto"
            className="h-11 w-full rounded-full border border-adm-line bg-adm-soft pr-4 pl-10 text-sm outline-none transition focus:border-adm-ink focus:bg-white focus:ring-4 focus:ring-adm-ink/10"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-adm-soft px-4 py-10 text-center text-sm text-adm-muted">
          {query ? `Nenhuma entrega com "${query}".` : "Nenhuma entrega neste filtro."}
        </p>
      ) : (
        <>
          {/* Computador: tabela */}
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-adm-line text-adm-muted">
                  <th scope="col" className="py-3 pr-4 font-medium">Cliente / projeto</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Gravação</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Conteúdo</th>
                  <th scope="col" className="py-3 pr-4 text-right font-medium">Espaço</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Status</th>
                  <th scope="col" className="py-3"><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => (
                  <tr key={g.slug} className="group border-b border-adm-line/70 last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/${g.slug}`} className="flex items-center gap-3 rounded-xl outline-offset-4">
                        <Thumb g={g} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-adm-ink group-hover:underline">{g.title}</span>
                          <span className="block truncate text-xs text-adm-muted">Criada em {g.createdLabel}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-adm-ink-2">{g.dateLabel || "—"}</td>
                    <td className="py-3 pr-4 text-adm-ink-2">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="photos" className="h-4 w-4 text-adm-muted" />
                          <span className="tabular-nums">{g.photos}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="film" className="h-4 w-4 text-adm-muted" />
                          <span className="tabular-nums">{g.videos}</span>
                        </span>
                        {g.favorites > 0 && (
                          <span className="inline-flex items-center gap-1 text-rose-700">
                            <Icon name="heart" className="h-4 w-4" />
                            <span className="tabular-nums">{g.favorites}</span>
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums font-medium">{g.sizeLabel}</td>
                    <td className="py-3 pr-4">
                      <Status g={g} />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/${g.slug}`}
                        aria-label={`Abrir ${g.title}`}
                        className="inline-grid h-9 w-9 place-items-center rounded-full bg-adm-soft text-adm-ink-2 transition group-hover:bg-adm-ink group-hover:text-white"
                      >
                        <Icon name="arrow" className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: cartões */}
          <ul className="mt-4 grid grid-cols-1 gap-2 md:hidden">
            {visible.map((g) => (
              <li key={g.slug}>
                <Link href={`/admin/${g.slug}`} className="flex items-center gap-3 rounded-2xl bg-adm-soft p-3">
                  <Thumb g={g} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{g.title}</span>
                    <span className="block truncate text-xs text-adm-muted">
                      {[g.dateLabel, plural(g.photos, "foto", "fotos"), plural(g.videos, "vídeo", "vídeos"), g.sizeLabel]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="mt-1.5 block">
                      <Status g={g} />
                    </span>
                  </span>
                  <Icon name="chevron" className="h-4 w-4 shrink-0 text-adm-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
