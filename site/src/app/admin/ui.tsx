// Peças visuais do painel: cards, indicadores, pílulas de status e ícones.
// Sem estado, então servem tanto em páginas do servidor quanto em componentes do cliente.

export const card = "rounded-[28px] bg-adm-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:p-7";

const ICONS = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  plus: "M12 5v14M5 12h14",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  message: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5",
  image: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5a1.5 1.5 0 1 0 0-.01",
  film: "M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4",
  photos: "M7 7h13v13H7zM4 4h13M4 4v13M7 16l3.5-3.5 3 3 2-2 4.5 4.5",
  download: "M12 4v11M7 10l5 5 5-5M5 19h14",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  trash: "M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  arrow: "M7 17 17 7M8 7h9v9",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  chevron: "M9 6l6 6-6 6",
  back: "M15 6l-6 6 6 6",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  alert: "M12 4 3 20h18zM12 10v4M12 17h.01",
  check: "M5 12.5l4.5 4.5L19 7",
  inbox: "M4 13h4l2 3h4l2-3h4M4 13l2.5-8h11L20 13v6H4z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  x: "M6 6l12 12M18 6 6 18",
  upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
  storage: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  dark = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: IconName;
  dark?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] p-5 ${
        dark
          ? "bg-[radial-gradient(120%_140%_at_100%_0%,#3d3d42_0%,#1c1c1e_55%)] text-white"
          : "bg-adm-surface text-adm-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm ${dark ? "text-white/70" : "text-adm-muted"}`}>{label}</p>
        {icon && (
          <span
            className={`grid h-8 w-8 place-items-center rounded-full ${dark ? "bg-white/10 text-white" : "bg-adm-soft text-adm-ink-2"}`}
          >
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
      {hint && <p className={`mt-2 text-xs ${dark ? "text-white/60" : "text-adm-muted"}`}>{hint}</p>}
    </div>
  );
}

export type PillTone = "neutral" | "warn" | "ok" | "dark" | "love";

const PILL: Record<PillTone, string> = {
  neutral: "bg-adm-chip text-adm-ink-2",
  warn: "bg-amber-100 text-amber-900",
  ok: "bg-emerald-50 text-emerald-800",
  dark: "bg-adm-ink text-white",
  love: "bg-rose-50 text-rose-700",
};

export function Pill({ tone = "neutral", children }: { tone?: PillTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${PILL[tone]}`}>
      {children}
    </span>
  );
}

/** Card de uma seção da entrega, com âncora para o menu lateral. */
export function Section({
  id,
  title,
  description,
  icon,
  count,
  actions,
  danger = false,
  className = "",
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  icon?: IconName;
  count?: React.ReactNode;
  actions?: React.ReactNode;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={`${card} scroll-mt-24 transition-shadow data-[drop]:ring-2 data-[drop]:ring-adm-ink data-[drop]:ring-offset-4 data-[drop]:ring-offset-adm-bg lg:scroll-mt-8 ${danger ? "ring-1 ring-red-200" : ""} ${className}`}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {icon && (
            <span
              className={`hidden h-10 w-10 shrink-0 place-items-center rounded-2xl sm:grid ${
                danger ? "bg-red-50 text-red-700" : "bg-adm-soft text-adm-ink-2"
              }`}
            >
              <Icon name={icon} />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={`${id}-titulo`} className={`flex items-center gap-2 text-lg font-semibold ${danger ? "text-red-800" : ""}`}>
              {title}
              {count !== undefined && <Pill>{count}</Pill>}
            </h2>
            {description && <p className="mt-1 max-w-[68ch] text-sm leading-6 text-adm-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="-mt-1 -mr-1 flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-adm-ink px-5 text-sm font-semibold text-white transition hover:bg-adm-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ink disabled:opacity-60";
export const btnGhost =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-adm-surface px-5 text-sm font-medium text-adm-ink ring-1 ring-adm-line transition hover:ring-adm-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ink disabled:opacity-60";
