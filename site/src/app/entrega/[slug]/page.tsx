import { notFound } from "next/navigation";
import {
  GALLERY_COVER,
  albumOf,
  coverPhoto,
  fileKey,
  galleryAlbums,
  getGalleryByLink,
  getPhotoDims,
  isConfigured,
  listGalleryFiles,
  signGet,
  sortVideos,
  videoCoverName,
} from "@/lib/r2";
import { isAdmin } from "@/lib/auth";
import { formatDate, formatSize, videoTitle } from "@/lib/format";
import VideoSection, { type VideoItem } from "./VideoSection";
import PhotoGallery, { type PhotoItem } from "./PhotoGallery";
import TopBar from "./TopBar";
import DownloadMenu, { type DownloadOption } from "./DownloadMenu";
import FeedbackForm from "./FeedbackForm";
import EntregaFooter from "../EntregaFooter";

export default async function GaleriaPage({ params }: { params: Promise<{ slug: string }> }) {
  // O endereço é /entrega/<nome-do-projeto>-<código>; o código impede que adivinhem o link
  const { slug: link } = await params;
  if (!isConfigured()) notFound();

  const meta = await getGalleryByLink(link);
  if (!meta) notFound();
  const slug = meta.slug;

  // Sem senha: quem tem o link da galeria vê tudo
  const admin = await isAdmin();

  const [files, dims] = await Promise.all([listGalleryFiles(slug), getPhotoDims(slug)]);
  const thumbs = new Set(files.thumbs.map((f) => f.name));
  const webs = new Set(files.web.map((f) => f.name));
  const base = `galleries/${slug}`;
  const covers = new Set(files.covers.map((f) => f.name));
  const coverUrl = (name: string) => (covers.has(name) ? signGet(fileKey(slug, "covers", name)) : undefined);

  const [videos, photos, downloads] = await Promise.all([
    Promise.all(
      sortVideos(meta, files.videos).map(
        async (f): Promise<VideoItem> => {
          const src = await signGet(f.key);
          return {
            name: f.name,
            title: videoTitle(f.name, meta.videoTitles),
            size: formatSize(f.size),
            src,
            download: src,
            poster: await coverUrl(videoCoverName(f.name)),
          };
        }
      )
    ),
    Promise.all(
      files.photos.map(async (f): Promise<PhotoItem> => {
        const full = await signGet(f.key);
        const derived = `${f.name}.jpg`;
        // Sem medida salva (galeria antiga ainda não otimizada): reserva um retângulo 3:2
        const [w, h] = dims[f.name] ?? [3, 2];
        return {
          name: f.name,
          album: albumOf(f.name),
          file: f.name.slice(f.name.lastIndexOf("/") + 1),
          size: f.size,
          w,
          h,
          thumb: thumbs.has(derived) ? await signGet(`${base}/thumbs/${derived}`) : full,
          web: webs.has(derived) ? await signGet(`${base}/web/${derived}`) : full,
          download: full,
        };
      })
    ),
    Promise.all(
      files.downloads.map(async (f) => ({
        name: f.name,
        size: formatSize(f.size),
        url: await signGet(f.key),
      }))
    ),
  ]);

  // Álbuns na ordem do admin; fotos de cada álbum em ordem de nome
  const albums = galleryAlbums(meta);
  for (const p of photos) {
    if (!albums.some((a) => a.id === p.album)) albums.push({ id: p.album, title: p.album || "Fotos" });
  }
  const albumOrder = new Map(albums.map((a, i) => [a.id, i]));
  photos.sort((a, b) => albumOrder.get(a.album)! - albumOrder.get(b.album)!);

  const extraDownloads: DownloadOption[] = [
    ...videos.map((v) => ({ kind: "link" as const, label: v.title, detail: `Vídeo · ${v.size}`, href: v.download })),
    ...downloads.map((d) => ({ kind: "link" as const, label: d.name, detail: d.size, href: d.url })),
  ];

  const coverName = coverPhoto(meta, files.photos.map((f) => f.name));
  // Capa: a enviada no admin; sem ela, a foto da capa; numa galeria só de vídeos, a capa do primeiro vídeo
  const cover =
    (await coverUrl(GALLERY_COVER)) ??
    photos.find((p) => p.name === coverName)?.web ??
    videos.find((v) => v.poster)?.poster;

  return (
    <main>
      {/* Capa em tela cheia */}
      <header id="capa" className="relative h-[100svh] min-h-[480px] overflow-hidden bg-void text-white">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-[16svh] text-center">
          {meta.date && (
            <p className="text-xs uppercase tracking-[0.3em] text-white/75 md:text-sm">{formatDate(meta.date)}</p>
          )}
          <h1 className="mt-3 max-w-4xl text-3xl font-light uppercase leading-tight tracking-[0.12em] md:text-5xl">
            {meta.title}
          </h1>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {photos.length > 0 && (
              <a
                href="#fotos"
                className="border border-white/90 px-8 py-3 text-xs font-medium uppercase tracking-[0.25em] transition hover:bg-paper hover:text-ink md:text-sm"
              >
                Ver galeria
              </a>
            )}
            {videos.length > 0 && (
              <a
                href="#filme"
                className="border border-white/90 px-8 py-3 text-xs font-medium uppercase tracking-[0.25em] transition hover:bg-paper hover:text-ink md:text-sm"
              >
                {videos.length > 1 ? "Assistir aos vídeos" : "Assistir ao vídeo"}
              </a>
            )}
          </div>
        </div>

        <p className="absolute inset-x-0 bottom-8 z-10 text-center text-[11px] uppercase tracking-[0.4em] text-white/80">
          IB Films
        </p>
      </header>

      {photos.length === 0 && (
        <TopBar title={meta.title} slug={slug} admin={admin}>
          {extraDownloads.length > 0 && <DownloadMenu options={extraDownloads} />}
        </TopBar>
      )}

      {videos.length > 0 && <VideoSection videos={videos} />}

      {photos.length > 0 && (
        <PhotoGallery
          slug={slug}
          link={link}
          title={meta.title}
          admin={admin}
          albums={albums}
          photos={photos}
          initialFavorites={files.favorites.map((f) => f.name)}
          extraDownloads={extraDownloads}
        />
      )}

      {downloads.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-12 md:px-10 lg:py-16">
          <p className="text-sm uppercase tracking-[0.2em] text-mist">Downloads</p>
          <h2 className="mt-3 text-3xl font-semibold">Arquivos completos</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {downloads.map((d) => (
              <li key={d.name}>
                <a
                  href={d.url}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-line bg-[#0c1d28] p-5 shadow-sm transition hover:border-mist/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="text-sm text-mist">{d.size}</span>
                  </span>
                  <span className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
                    Baixar
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {videos.length + photos.length + downloads.length === 0 && (
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-lg leading-8 text-paper/75">
            Estamos finalizando o material do seu projeto. Assim que estiver pronto, ele aparece aqui.
          </p>
        </section>
      )}

      {/* Recado geral sobre a entrega; não aparece enquanto a galeria está vazia */}
      {videos.length + photos.length + downloads.length > 0 && <FeedbackForm link={link} title={meta.title} />}

      <EntregaFooter>
        Os links de download expiram em 12 horas. Se algum parar de funcionar, é só recarregar a página.
      </EntregaFooter>
    </main>
  );
}
