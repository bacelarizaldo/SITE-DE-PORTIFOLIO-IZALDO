"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import MoreMenu, { menuItem } from "./MoreMenu";
import { Icon, Pill } from "./ui";

export type GalleryRow = {
  slug: string;
  title: string;
  dateLabel: string;
  createdLabel: string;
  /** Para ordenar: data da gravação (ou da criação) em ISO */
  sortDate: string;
  /** Data de criação em ISO */
  createdAt: string;
  /** Endereço da página do cliente (/entrega/...) */
  link: string;
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
type Sort = "recentes" | "antigas" | "gravacao" | "nome" | "espaco";
type View = "cartoes" | "lista";

const SORTS: { id: Sort; label: string }[] = [
  { id: "recentes", label: "Criação · mais recentes" },
  { id: "antigas", label: "Criação · mais antigas" },
  { id: "gravacao", label: "Data da gravação" },
  { id: "nome", label: "Nome (A–Z)" },
  { id: "espaco", label: "Maior espaço" },
];

const VIEW_KEY = "ib:entregas-visao";
const VIEW_EVENT = "ib:entregas-visao";
function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "lista" ? "lista" : "cartoes";
  } catch {
    return "cartoes";
  }
}
function subscribeView(onChange: () => void) {
  window.addEventListener(VIEW_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(VIEW_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function sortRows(rows: GalleryRow[], sort: Sort) {
  const list = [...rows];
  if (sort === "recentes") list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === "antigas") list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (sort === "gravacao") list.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
  if (sort === "nome") list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  if (sort === "espaco") list.sort((a, b) => b.bytes - a.bytes);
  return list;
}

/** Cartão de uma entrega: capa, nome, data, copiar link e o menu ⋯. */
function Card({ g }: { g: GalleryRow }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`${location.origin}${g.link}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const media = g.photos + g.videos;
  return (
    <li className="group flex flex-col overflow-hidden rounded-[22px] bg-adm-surface p-2 ring-1 ring-adm-line transition hover:shadow-md hover:ring-adm-line-strong">
      <Link href={`/admin/${g.slug}`} className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-adm-chip">
        {g.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-adm-muted">
            <Icon name="image" className="h-7 w-7" />
          </span>
        )}
        <span className="sr-only">Abrir {g.title}</span>
      </Link>
      <div className="flex items-start gap-1 px-2 pt-3">
        <Link href={`/admin/${g.slug}`} className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{g.title}</span>
          <span className="mt-1 flex items-center gap-1.5 text-sm text-adm-muted">
            <Icon name="calendar" className="h-3.5 w-3.5" />
            {g.dateLabel || `Criada em ${g.createdLabel}`}
          </span>
        </Link>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar o link de ${g.title}`}
          title={copied ? "Link copiado!" : "Copiar link do cliente"}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${copied ? "bg-emerald-50 text-emerald-700" : "text-adm-ink-2 hover:bg-adm-soft"}`}
        >
          <Icon name={copied ? "check" : "link"} className="h-4 w-4" />
        </button>
        <MoreMenu label={`Mais opções de ${g.title}`}>
          <Link href={`/admin/${g.slug}`} className={menuItem}>
            <Icon name="edit" className="h-4 w-4" />
            Abrir no admin
          </Link>
          <a href={g.link} target="_blank" rel="noreferrer" className={menuItem}>
            <Icon name="globe" className="h-4 w-4" />
            Ver como o cliente vê
          </a>
          <button type="button" onClick={copy} className={menuItem}>
            <Icon name="link" className="h-4 w-4" />
            Copiar link do cliente
          </button>
        </MoreMenu>
      </div>
      <div className="mx-2 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-adm-line pt-3 pb-1 text-sm text-adm-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="photos" className="h-4 w-4 text-adm-muted" />
          {plural(media, "mídia", "mídias")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="storage" className="h-4 w-4 text-adm-muted" />
          {g.sizeLabel}
        </span>
        {g.favorites > 0 && (
          <span className="inline-flex items-center gap-1 text-rose-700">
            <Icon name="heart" className="h-4 w-4" />
            {g.favorites}
          </span>
        )}
      </div>
      {(needsAttention(g) || isEmpty(g)) && (
        <div className="px-2 pt-2 pb-1">
          <Status g={g} />
        </div>
      )}
    </li>
  );
}

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
  const [sort, setSort] = useState<Sort>("recentes");
  const view = useSyncExternalStore(subscribeView, readView, () => "cartoes" as View);
  const chooseView = (next: View) => {
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
    window.dispatchEvent(new Event(VIEW_EVENT));
  };

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
  const ordered = useMemo(() => sortRows(visible, sort), [visible, sort]);

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
        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
        <label className="relative block md:w-64">
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
        <label className="relative inline-flex h-11 items-center gap-2 rounded-full border border-adm-line bg-adm-surface pr-3 pl-4 text-sm">
          <Icon name="sort" className="h-4 w-4 text-adm-muted" />
          <span className="sr-only">Ordenar por</span>
          <select
            id="ordenar-entregas"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="cursor-pointer appearance-none bg-transparent pr-5 font-medium outline-none"
          >
            {SORTS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon name="chevron" className="pointer-events-none absolute right-3 h-3.5 w-3.5 rotate-90 text-adm-muted" />
        </label>
        <div role="group" aria-label="Visualização" className="flex gap-1 rounded-full bg-adm-soft p-1">
          {(["cartoes", "lista"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => chooseView(v)}
              aria-pressed={view === v}
              aria-label={v === "cartoes" ? "Ver em cartões" : "Ver em lista"}
              className={`grid h-9 w-9 place-items-center rounded-full transition ${view === v ? "bg-adm-ink text-white" : "text-adm-ink-2 hover:text-adm-ink"}`}
            >
              <Icon name={v === "cartoes" ? "grid" : "list"} className="h-4 w-4" />
            </button>
          ))}
        </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-adm-soft px-4 py-10 text-center text-sm text-adm-muted">
          {query ? `Nenhuma entrega com "${query}".` : "Nenhuma entrega neste filtro."}
        </p>
      ) : view === "cartoes" ? (
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {ordered.map((g) => (
            <Card key={g.slug} g={g} />
          ))}
        </ul>
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
                {ordered.map((g) => (
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
            {ordered.map((g) => (
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
