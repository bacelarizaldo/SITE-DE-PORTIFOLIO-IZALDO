import Link from "next/link";
import { adminLogout } from "./actions";
import SectionNav, { type NavSection } from "./SectionNav";
import { Icon, type IconName } from "./ui";

function NavLink({
  href,
  icon,
  label,
  active = false,
  external = false,
}: {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
  external?: boolean;
}) {
  const className = `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] transition ${
    active ? "bg-adm-ink text-white" : "text-adm-ink-2 hover:bg-adm-soft"
  }`;
  const content = (
    <>
      <Icon name={icon} className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1">{label}</span>
      {external && <Icon name="arrow" className="h-3.5 w-3.5 opacity-50" />}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} aria-current={active ? "page" : undefined} className={className}>
      {content}
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-baseline gap-2">
      <span className="text-[22px] font-bold tracking-tight">IB Films</span>
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-adm-muted">Entregas</span>
    </Link>
  );
}

/**
 * Moldura do painel: barra lateral no computador, cabeçalho compacto no celular.
 * Na página de uma entrega, a barra lateral também lista as seções dela.
 */
export default function AdminShell({
  children,
  current = "entregas",
  sections,
  galleryTitle,
}: {
  children: React.ReactNode;
  current?: "entregas" | "entrega";
  sections?: NavSection[];
  galleryTitle?: string;
}) {
  return (
    <div className="min-h-screen bg-adm-bg lg:flex">
      <aside className="hidden w-[268px] shrink-0 lg:block">
        <div className="sticky top-0 flex h-screen flex-col overflow-y-auto bg-adm-surface px-4 py-7">
          <div className="px-3">
            <Brand />
          </div>
          <nav aria-label="Painel" className="mt-8 grid gap-0.5">
            <NavLink href="/admin" icon="grid" label="Entregas" active={current === "entregas"} />
            <NavLink href="/admin#nova" icon="plus" label="Nova entrega" />
            <NavLink href="/" icon="globe" label="Ver o site" external />
          </nav>

          {sections && (
            <div className="mt-8">
              <p className="mb-2 truncate px-3 text-xs font-medium uppercase tracking-[0.16em] text-adm-muted">
                {galleryTitle ?? "Esta entrega"}
              </p>
              <SectionNav sections={sections} variant="side" />
            </div>
          )}

          <div className="mt-auto pt-8">
            <form action={adminLogout}>
              <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] text-adm-ink-2 transition hover:bg-adm-soft">
                <Icon name="logout" className="h-[18px] w-[18px]" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-adm-line bg-adm-bg/90 px-4 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between gap-3">
            <Brand />
            <div className="flex items-center gap-1">
              {current === "entrega" && (
                <Link href="/admin" className="rounded-full px-3 py-1.5 text-sm font-medium text-adm-ink-2 hover:bg-adm-surface">
                  Entregas
                </Link>
              )}
              <form action={adminLogout}>
                <button className="rounded-full px-3 py-1.5 text-sm font-medium text-adm-ink-2 hover:bg-adm-surface">Sair</button>
              </form>
            </div>
          </div>
          {sections && <SectionNav sections={sections} variant="top" />}
        </header>

        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
