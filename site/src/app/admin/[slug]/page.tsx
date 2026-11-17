import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  GALLERY_COVER,
  albumOf,
  coverPhoto,
  fileKey,
  galleryAlbums,
  galleryPath,
  getMeta,
  getPhotoDims,
  listFeedback,
  listGalleryFiles,
  signGet,
  sortVideos,
  videoCoverName,
  type Category,
  type StoredFile,
} from "@/lib/r2";
import { formatDate, formatDateTime, formatShortDate, formatSize, greeting, titleFromFileName, videoTitle } from "@/lib/format";
import { EditGalleryForm } from "../forms";
import { deleteCategory, deleteFeedback, deleteFile, deleteGallery, markFeedbackSeen } from "../actions";
import Uploader from "./Uploader";
import CopyBox from "./CopyBox";
import AccessCard from "./AccessCard";
import ConfirmButton from "./ConfirmButton";
import { type AdminPhoto } from "./PhotoGrid";
import PhotosPanel from "./PhotosPanel";
import DimsBackfill from "./DimsBackfill";
import VideoList, { type AdminVideo } from "./VideoList";
import CoverPicker from "./CoverPicker";
import AdminShell from "../AdminShell";
import { type NavSection } from "../SectionNav";
import { Icon, Pill, Section, StatTile, btnGhost, btnPrimary } from "../ui";
import MoreMenu, { menuItemDanger } from "../MoreMenu";



// Mensagem pronta para o WhatsApp ou e-mail; o conteúdo acompanha o que já foi enviado
function deliveryMessage(g: { project: string; link: string; hasVideos: boolean; hasPhotos: boolean }) {
  const both = g.hasVideos === g.hasPhotos;
  const what = both ? "os vídeos e as fotos" : g.hasVideos ? "os vídeos" : "as fotos";

  return `${greeting()}! Tudo bem?

A entrega do projeto ${g.project} está pronta. Neste link estão ${what} em alta qualidade, para assistir e baixar no computador ou no celular:

🔗 ${g.link}

O link é exclusivo da sua empresa: compartilhe só com quem precisa ter acesso. Recomendamos baixar tudo e guardar uma cópia no servidor ou na nuvem da empresa, porque os links de download têm validade.

No fim da página há um espaço para deixar um recado, com sua opinião ou algum ajuste que queira pedir.

Se publicarem nas redes, marquem @izaldobacelar. Qualquer dúvida, estou à disposição!

Izaldo Bacelar · IB Films`;
}

const CATEGORY_LABEL: Record<Category, string> = {
  videos: "todos os vídeos",
  photos: "todas as fotos",
  downloads: "todos os downloads extras",
};

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;

/** "12 · 4,6 GB": quantos arquivos e quanto espaço, para o contador da seção */
function countLabel(files: StoredFile[]) {
  if (!files.length) return "0";
  return `${files.length.toLocaleString("pt-BR")} · ${formatSize(files.reduce((a, f) => a + f.size, 0))}`;
}

/** Item "Excluir todos" do menu ⋯ de uma seção */
function DeleteAllItem({ slug, category, files }: { slug: string; category: Category; files: StoredFile[] }) {
  const total = formatSize(files.reduce((a, f) => a + f.size, 0));
  return (
    <form action={deleteCategory}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="category" value={category} />
      <ConfirmButton
        message={`Excluir ${CATEGORY_LABEL[category]} (${plural(files.length, "arquivo", "arquivos")}, ${total})? Não dá para desfazer.`}
        className={menuItemDanger}
      >
        <Icon name="trash" className="h-4 w-4" />
        Excluir {CATEGORY_LABEL[category]}
      </ConfirmButton>
    </form>
  );
}

function SectionMenu({ slug, category, files }: { slug: string; category: Category; files: StoredFile[] }) {
  if (!files.length) return null;
  return (
    <MoreMenu label="Mais ações">
      <DeleteAllItem slug={slug} category={category} files={files} />
    </MoreMenu>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-2xl bg-adm-soft px-4 py-6 text-center text-sm text-adm-muted">{children}</p>;
}

/** Lista simples de arquivos (downloads extras) */
function FileRows({ slug, files }: { slug: string; files: StoredFile[] }) {
  return (
    <ul className="mt-4 divide-y divide-adm-line overflow-hidden rounded-[22px] bg-adm-soft">
      {files.map((f) => (
        <li key={f.key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <Icon name="download" className="h-4 w-4 shrink-0 text-adm-muted" />
          <span className="min-w-0 flex-1 truncate font-medium" title={f.name}>
            {f.name}
          </span>
          <span className="shrink-0 tabular-nums text-adm-muted">{formatSize(f.size)}</span>
          <form action={deleteFile}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="key" value={f.key} />
            <ConfirmButton
              message={`Excluir ${f.name}? Não dá para desfazer.`}
              className="grid h-8 w-8 place-items-center rounded-full text-adm-ink-2 transition hover:bg-red-50 hover:text-red-700"
            >
              <span className="sr-only">Excluir {f.name}</span>
              <Icon name="trash" className="h-4 w-4" />
            </ConfirmButton>
          </form>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { slug } = await params;
  const meta = await getMeta(slug);
  if (!meta) notFound();

  const [files, dims, feedback] = await Promise.all([listGalleryFiles(slug), getPhotoDims(slug), listFeedback(slug)]);
  const seenAt = meta.feedbackSeenAt ?? "";
  const unread = feedback.filter((f) => f.createdAt > seenAt).length;
  const thumbs = new Set(files.thumbs.map((f) => f.name));
  const photos: AdminPhoto[] = await Promise.all(
    files.photos.map(async (f) => ({
      key: f.key,
      name: f.name,
      size: formatSize(f.size),
      // Sem miniatura (ex.: HEIC), usa o original
      thumb: await signGet(thumbs.has(`${f.name}.jpg`) ? `galleries/${slug}/thumbs/${f.name}.jpg` : f.key),
    }))
  );
  const missingDims = photos.filter((p) => !dims[p.name]).map((p) => ({ name: p.name, url: p.thumb }));

  const favorites = files.favorites.map((f) => f.name);
  const albums = galleryAlbums(meta);
  for (const p of photos) {
    const id = albumOf(p.name);
    if (!albums.some((a) => a.id === id)) albums.push({ id, title: id || "Fotos" });
  }
  const covers = new Set(files.covers.map((f) => f.name));
  const coverUrl = (name: string) => (covers.has(name) ? signGet(fileKey(slug, "covers", name)) : undefined);
  const galleryCover = await coverUrl(GALLERY_COVER);
  const videos: AdminVideo[] = await Promise.all(
    sortVideos(meta, files.videos).map(async (f) => ({
      key: f.key,
      name: f.name,
      size: formatSize(f.size),
      title: videoTitle(f.name, meta.videoTitles),
      fallback: titleFromFileName(f.name),
      cover: await coverUrl(videoCoverName(f.name)),
    }))
  );
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const link = `${proto}://${host}${galleryPath(meta)}`;

  const shareText = deliveryMessage({
    project: meta.title,
    link,
    hasVideos: files.videos.length > 0,
    hasPhotos: files.photos.length > 0,
  });

  const totalBytes = Object.values(files)
    .flat()
    .reduce((a, f) => a + f.size, 0);
  const overAYear = new Date(meta.createdAt).getTime() < new Date().setFullYear(new Date().getFullYear() - 1);
  const albumCount = albums.filter((a) => photos.some((p) => albumOf(p.name) === a.id)).length;

  const sections: NavSection[] = [
    { id: "acesso", label: "Acesso e mensagem", icon: "link" },
    { id: "feedback", label: "Feedback", icon: "inbox", badge: unread ? `${unread} novo${unread > 1 ? "s" : ""}` : String(feedback.length) },
    { id: "capa", label: "Capa", icon: "image" },
    { id: "videos", label: "Vídeos", icon: "film", badge: String(files.videos.length) },
    { id: "fotos", label: "Fotos", icon: "photos", badge: String(files.photos.length) },
    { id: "downloads", label: "Downloads extras", icon: "download", badge: String(files.downloads.length) },
    { id: "dados", label: "Dados e exclusão", icon: "edit" },
  ];

  return (
    <AdminShell current="entrega" galleryTitle={meta.title} sections={sections}>
      <nav aria-label="Caminho" className="flex items-center gap-1.5 text-sm text-adm-muted">
        <Link href="/admin" className="hover:text-adm-ink hover:underline">
          Entregas
        </Link>
        <Icon name="chevron" className="h-3.5 w-3.5" />
        <span className="truncate text-adm-ink-2">{meta.title}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight md:text-[38px]">{meta.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-adm-muted">
            {meta.date && <span>Gravado em {formatDate(meta.date)}</span>}
            {meta.date && <span aria-hidden="true">·</span>}
            <span>Criada em {formatShortDate(meta.createdAt)}</span>
            {!meta.accessKey && <Pill tone="warn">Link sem código</Pill>}
            {overAYear && <Pill tone="warn">Mais de 1 ano: confira o prazo</Pill>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="#dados" className={btnGhost}>
            <Icon name="edit" className="h-4 w-4" />
            Editar dados
          </a>
          <Link href={galleryPath(meta)} className={btnPrimary}>
            Ver como o cliente vê
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatTile dark label="Espaço no R2" icon="storage" value={formatSize(totalBytes)} hint="Com miniaturas e versões web" />
        <StatTile
          label="Fotos"
          icon="photos"
          value={files.photos.length.toLocaleString("pt-BR")}
          hint={albumCount > 1 ? `em ${albumCount} álbuns` : files.photos.length ? "em 1 álbum" : "Nenhuma enviada"}
        />
        <StatTile
          label="Vídeos"
          icon="film"
          value={files.videos.length.toLocaleString("pt-BR")}
          hint={files.downloads.length ? `+ ${files.downloads.length} download${files.downloads.length > 1 ? "s" : ""} extra${files.downloads.length > 1 ? "s" : ""}` : "Nenhum download extra"}
        />
        <StatTile
          label="Favoritas do cliente"
          icon="heart"
          value={favorites.length.toLocaleString("pt-BR")}
          hint={favorites.length ? "Veja no filtro das fotos" : "O cliente ainda não favoritou"}
        />
      </div>

      <div id="acesso" className="mt-4 grid grid-cols-1 scroll-mt-24 gap-4 lg:scroll-mt-8 xl:grid-cols-2">
        <Section id="acesso-link" title="Acesso do cliente" icon="link" description="Quem tem o link abre a entrega, sem senha.">
          <AccessCard slug={slug} link={link} hasCode={Boolean(meta.accessKey)} />
        </Section>
        <Section id="mensagem" title="Mensagem para o cliente" icon="message" description="Pronta para copiar e colar.">
          <CopyBox text={shareText} />
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Section
          id="feedback"
          title="Feedback"
          icon="inbox"
          count={unread ? `${unread} novo${unread > 1 ? "s" : ""}` : feedback.length}
          description="Recados que o cliente deixa no fim da página de entrega."
          actions={
            unread > 0 && (
              <form action={markFeedbackSeen}>
                <input type="hidden" name="slug" value={slug} />
                <button className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-adm-ink ring-1 ring-adm-line transition hover:ring-adm-line-strong">
                  <Icon name="check" className="h-4 w-4" />
                  Marcar como lidos
                </button>
              </form>
            )
          }
        >
          {feedback.length === 0 ? (
            <p className="rounded-2xl bg-adm-soft px-4 py-6 text-center text-sm text-adm-muted">
              Nenhum recado ainda. Eles aparecem aqui assim que alguém escrever na{" "}
              <Link href={`${galleryPath(meta)}#recado`} className="font-medium text-adm-ink underline underline-offset-2">
                página de entrega
              </Link>
              .
            </p>
          ) : (
            <ul className="grid max-h-[32rem] grid-cols-1 gap-2 overflow-y-auto">
              {feedback.map((f) => {
                const isNew = f.createdAt > seenAt;
                return (
                  <li key={f.id} className={`rounded-[22px] p-4 ${isNew ? "bg-adm-soft ring-1 ring-adm-line-strong" : "bg-adm-soft"}`}>
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-adm-ink text-sm font-semibold text-white"
                      >
                        {(f.name?.trim()[0] ?? "?").toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-semibold">{f.name || "Sem nome"}</span>
                          <span className="text-xs text-adm-muted">{formatDateTime(f.createdAt)}</span>
                          {isNew && <Pill tone="dark">Novo</Pill>}
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-6 text-adm-ink-2">{f.message}</p>
                      </div>
                      <form action={deleteFeedback}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="id" value={f.id} />
                        <ConfirmButton
                          message={`Excluir o recado${f.name ? ` de ${f.name}` : ""}? Não dá para desfazer.`}
                          className="grid h-8 w-8 place-items-center rounded-full text-adm-ink-2 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <span className="sr-only">Excluir recado</span>
                          <Icon name="trash" className="h-4 w-4" />
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section
          id="capa"
          title="Capa da entrega"
          icon="image"
          description={
            galleryCover
              ? "Abre a página de entrega em tela cheia."
              : "Abre a página de entrega em tela cheia. Sem ela, entra a capa das fotos."
          }
        >
          <CoverPicker slug={slug} current={galleryCover} size="large" />
        </Section>

        <Section
          id="videos"
          title="Vídeos"
          icon="film"
          count={countLabel(files.videos)}
          description="MP4 (H.264). O primeiro da lista abre a página de entrega."
          actions={<SectionMenu slug={slug} category="videos" files={files.videos} />}
        >
          <Uploader slug={slug} category="videos" label="Enviar vídeos" existing={files.videos.map((f) => f.name)} />
          {videos.length ? (
            <div className="mt-4">
              <VideoList slug={slug} videos={videos} />
            </div>
          ) : (
            <EmptyNote>Nenhum vídeo ainda.</EmptyNote>
          )}
        </Section>

        <Section
          id="fotos"
          title="Fotos"
          icon="photos"
          count={countLabel(files.photos)}
          description="JPG em alta, organizadas por álbum."
        >
          <DimsBackfill slug={slug} missing={missingDims} />
          <PhotosPanel
            slug={slug}
            albums={albums}
            photos={photos}
            favorites={favorites}
            cover={coverPhoto(meta, files.photos.map((f) => f.name))}
            coverChosen={Boolean(meta.cover && files.photos.some((f) => f.name === meta.cover))}
            coverOverridden={Boolean(galleryCover)}
            totalLabel={countLabel(files.photos)}
          />
        </Section>

        <Section
          id="downloads"
          title="Downloads extras"
          icon="download"
          count={countLabel(files.downloads)}
          description="Ex.: um .zip com todas as fotos."
          actions={<SectionMenu slug={slug} category="downloads" files={files.downloads} />}
        >
          <Uploader slug={slug} category="downloads" label="Enviar arquivos" existing={files.downloads.map((f) => f.name)} />
          {files.downloads.length ? <FileRows slug={slug} files={files.downloads} /> : <EmptyNote>Nenhum arquivo ainda.</EmptyNote>}
        </Section>

        <div id="dados" className="grid grid-cols-1 scroll-mt-24 gap-4 lg:scroll-mt-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Section id="dados-galeria" title="Dados da entrega" icon="edit">
            <EditGalleryForm slug={slug} title={meta.title} date={meta.date} />
          </Section>
          <Section
            id="excluir"
            title="Excluir entrega"
            icon="trash"
            danger
            description="Apaga a entrega e todos os arquivos dela no R2. Não dá para desfazer."
          >
            <form action={deleteGallery}>
              <input type="hidden" name="slug" value={slug} />
              <ConfirmButton
                message={`Excluir a entrega de ${meta.title} e todos os arquivos? Não dá para desfazer.`}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800"
              >
                <Icon name="trash" className="h-4 w-4" />
                Excluir {meta.title}
              </ConfirmButton>
            </form>
          </Section>
        </div>
      </div>
    </AdminShell>
  );
}
