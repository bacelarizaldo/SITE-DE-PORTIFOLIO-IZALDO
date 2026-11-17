import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import {
  GALLERY_COVER,
  coverPhoto,
  fileKey,
  isConfigured,
  listGalleries,
  listGalleryFiles,
  signGet,
  unreadFeedback,
} from "@/lib/r2";
import { formatShortDate, formatSize, greeting } from "@/lib/format";
import { AdminLoginForm } from "./forms";
import AdminShell from "./AdminShell";
import LoginScreen from "./LoginScreen";
import GalleryTable, { type GalleryRow } from "./GalleryTable";
import NewGalleryDialog from "./NewGalleryDialog";
import { Icon, StatTile, btnPrimary, card } from "./ui";

export const dynamic = "force-dynamic";

const GB = 1024 ** 3;
// R2: 10 GB grátis, depois US$ 0,015 por GB por mês (ENTREGAS.md)
const FREE_GB = 10;
const PRICE_PER_GB = 0.015;

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;

/** Barras de espaço das entregas mais recentes; a maior fica destacada. */
function StorageChart({ items }: { items: { slug: string; label: string; bytes: number }[] }) {
  const max = Math.max(...items.map((i) => i.bytes), 1);
  const ticks = [max, max / 2, 0];
  return (
    <div className="flex gap-3">
      <div aria-hidden="true" className="flex h-56 flex-col justify-between pb-7 text-right text-xs tabular-nums text-adm-muted">
        {ticks.map((t, n) => (
          <span key={n}>{t === 0 ? "0" : formatSize(t)}</span>
        ))}
      </div>
      <ul className="relative flex h-56 flex-1 items-end justify-around gap-2 sm:gap-4">
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[7px] border-t border-dashed border-adm-line" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[calc(50%-14px)] border-t border-dashed border-adm-line" />
        {items.map((i) => {
          const top = i.bytes === max;
          return (
            <li key={i.slug} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <Link
                href={`/admin/${i.slug}`}
                title={`${i.label}: ${formatSize(i.bytes)}`}
                aria-label={`${i.label}: ${formatSize(i.bytes)}`}
                className={`w-full max-w-14 rounded-2xl transition hover:opacity-80 ${
                  top ? "bg-adm-pill" : "bg-[repeating-linear-gradient(135deg,#1c1c1e_0_10px,#26262a_10px_20px)]"
                }`}
                style={{ height: `calc(${Math.max(4, (i.bytes / max) * 100)}% - 28px)` }}
              />
              <span className={`mt-2 h-5 w-full truncate text-center text-xs ${top ? "font-semibold text-adm-ink" : "text-adm-muted"}`}>
                {i.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Anel com a parte usada dos 10 GB grátis do R2. */
function FreeTierRing({ used }: { used: number }) {
  const pct = Math.min(100, Math.round((used / (FREE_GB * GB)) * 100));
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-adm-soft p-4">
      <div>
        <p className="font-semibold">Espaço grátis do R2</p>
        <p className="mt-0.5 text-xs text-adm-muted">
          {formatSize(used)} de {FREE_GB} GB {pct >= 100 ? "(acima do grátis)" : ""}
        </p>
      </div>
      <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90" role="img" aria-label={`${pct}% dos ${FREE_GB} GB grátis`}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e3e3e6" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={pct >= 100 ? "#b45309" : "#7c7c81"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
        <text x="32" y="36" textAnchor="middle" className="rotate-90 fill-adm-ink text-[13px] font-semibold" style={{ transformOrigin: "32px 32px" }}>
          {pct}%
        </text>
      </svg>
    </div>
  );
}

export default async function AdminPage() {
  if (!isConfigured()) {
    return (
      <LoginScreen>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">Configuração pendente</h1>
        <p className="mt-3 text-[15px] leading-6 text-adm-ink-2">
          Defina as variáveis R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, SESSION_SECRET e
          ADMIN_PASSWORD (no arquivo .env.local e na Vercel). O passo a passo está em ENTREGAS.md.
        </p>
      </LoginScreen>
    );
  }

  if (!(await isAdmin())) {
    return (
      <LoginScreen>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">Entrar no painel</h1>
        <p className="mt-2 text-[15px] leading-6 text-adm-muted">Entregas, recados e arquivos dos clientes da IB Films.</p>
        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </LoginScreen>
    );
  }

  const oneYearAgo = new Date().setFullYear(new Date().getFullYear() - 1);
  const galleries = await Promise.all(
    (await listGalleries()).map(async (g) => {
      const files = await listGalleryFiles(g.slug);
      // Espaço inclui miniaturas e versões web, que também contam no R2
      const bytes = Object.values(files)
        .flat()
        .reduce((a, f) => a + f.size, 0);
      // Miniatura da tabela: a capa enviada no admin ou a foto de capa
      const thumbs = new Set(files.thumbs.map((f) => f.name));
      const cover = coverPhoto(g, files.photos.map((f) => f.name));
      const thumb = files.covers.some((f) => f.name === GALLERY_COVER)
        ? await signGet(fileKey(g.slug, "covers", GALLERY_COVER))
        : cover && thumbs.has(`${cover}.jpg`)
          ? await signGet(fileKey(g.slug, "thumbs", `${cover}.jpg`))
          : undefined;
      const row: GalleryRow = {
        slug: g.slug,
        title: g.title,
        dateLabel: formatShortDate(g.date),
        createdLabel: formatShortDate(g.createdAt),
        sortDate: g.date ?? g.createdAt.slice(0, 10),
        photos: files.photos.length,
        videos: files.videos.length,
        downloads: files.downloads.length,
        favorites: files.favorites.length,
        bytes,
        sizeLabel: formatSize(bytes),
        thumb,
        newFeedback: unreadFeedback(g, files.feedback),
        noCode: !g.accessKey,
        // Prazo de 1 ano dos Termos: lembrete para excluir (contado da criação da entrega)
        overAYear: new Date(g.createdAt).getTime() < oneYearAgo,
      };
      return row;
    })
  );

  const totalBytes = galleries.reduce((a, g) => a + g.bytes, 0);
  const totalPhotos = galleries.reduce((a, g) => a + g.photos, 0);
  const totalVideos = galleries.reduce((a, g) => a + g.videos, 0);
  const totalFavorites = galleries.reduce((a, g) => a + g.favorites, 0);
  const monthly = Math.max(0, totalBytes / GB - FREE_GB) * PRICE_PER_GB;
  const attention = galleries.filter((g) => g.newFeedback > 0 || g.noCode || g.overAYear);
  const totalNewFeedback = galleries.reduce((a, g) => a + g.newFeedback, 0);
  // Gráfico: as 7 entregas mais recentes, da mais antiga para a mais nova
  const recent = galleries
    .slice(0, 7)
    .reverse()
    .map((g) => ({ slug: g.slug, bytes: g.bytes, label: g.title.split(/\s*[—–-]\s*/)[0] || g.title }));

  return (
    <AdminShell current="entregas">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-adm-muted">{greeting()}!</p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight md:text-[38px]">Entregas</h1>
        </div>
        <NewGalleryDialog />
      </div>

      {galleries.length === 0 ? (
        <section className={`${card} mt-8 text-center`}>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-adm-soft text-adm-ink-2">
            <Icon name="photos" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">Nenhuma entrega ainda</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-adm-muted">
            Crie a entrega do projeto, envie os vídeos e as fotos e mande o link pronto para o cliente.
          </p>
          <div className="mt-6 flex justify-center">
            {/* Abre a mesma janela do botão do topo */}
            <a href="#nova" className={btnPrimary}>
              <Icon name="plus" className="h-4 w-4" />
              Criar a primeira entrega
            </a>
          </div>
        </section>
      ) : (
        <>
          <div className="mt-7 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            <StatTile
              dark
              label="Espaço usado"
              icon="storage"
              value={formatSize(totalBytes)}
              hint={monthly > 0 ? `≈ US$ ${monthly.toFixed(2).replace(".", ",")}/mês no R2` : `Dentro dos ${FREE_GB} GB grátis do R2`}
            />
            <StatTile
              label="Entregas"
              icon="grid"
              value={galleries.length.toLocaleString("pt-BR")}
              hint={
                totalNewFeedback
                  ? plural(totalNewFeedback, "recado novo", "recados novos")
                  : attention.length
                    ? `${plural(attention.length, "precisa", "precisam")} de atenção`
                    : "Todas em dia"
              }
            />
            <StatTile label="Fotos entregues" icon="photos" value={totalPhotos.toLocaleString("pt-BR")} hint={`em ${plural(galleries.filter((g) => g.photos).length, "entrega", "entregas")}`} />
            <StatTile
              label="Vídeos entregues"
              icon="film"
              value={totalVideos.toLocaleString("pt-BR")}
              hint={totalFavorites ? `${plural(totalFavorites, "foto favoritada", "fotos favoritadas")} pelos clientes` : "Nenhuma favorita ainda"}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <section aria-labelledby="grafico-titulo" className={card}>
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h2 id="grafico-titulo" className="text-lg font-semibold">Espaço por entrega</h2>
                  <p className="mt-1 text-sm text-adm-muted">As {recent.length} mais recentes, com miniaturas e versões web</p>
                </div>
              </div>
              <StorageChart items={recent} />
            </section>

            <section aria-labelledby="atencao-titulo" className={`${card} flex flex-col`}>
              <h2 id="atencao-titulo" className="text-lg font-semibold">Precisa de atenção</h2>
              {attention.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                    <Icon name="check" />
                  </span>
                  <p className="mt-3 font-medium">Tudo em dia</p>
                  <p className="mt-1 text-sm text-adm-muted">Nenhum recado novo, todos os links têm código e nenhuma entrega passou de 1 ano.</p>
                </div>
              ) : (
                <ul className="mt-3 grid flex-1 content-start gap-1">
                  {attention.slice(0, 4).map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/admin/${g.slug}${g.newFeedback ? "#feedback" : ""}`}
                        className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-adm-soft"
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                            g.newFeedback ? "bg-adm-ink text-white" : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          <Icon name={g.newFeedback ? "inbox" : "alert"} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{g.title}</span>
                          <span className="block truncate text-xs text-adm-muted">
                            {[
                              g.newFeedback > 0 && `${plural(g.newFeedback, "recado novo", "recados novos")}`,
                              g.noCode && "Gere um link com código",
                              g.overAYear && "Passou de 1 ano: confira o prazo",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        <Icon name="chevron" className="h-4 w-4 shrink-0 text-adm-muted" />
                      </Link>
                    </li>
                  ))}
                  {attention.length > 4 && (
                    <li className="px-2 pt-1 text-xs text-adm-muted">e mais {attention.length - 4} no filtro da tabela</li>
                  )}
                </ul>
              )}
              <div className="mt-4">
                <FreeTierRing used={totalBytes} />
              </div>
            </section>
          </div>

          <section aria-labelledby="todas-titulo" className={`${card} mt-4`}>
            <h2 id="todas-titulo" className="mb-4 text-lg font-semibold">Todas as entregas</h2>
            <GalleryTable rows={galleries} />
          </section>
        </>
      )}
    </AdminShell>
  );
}
