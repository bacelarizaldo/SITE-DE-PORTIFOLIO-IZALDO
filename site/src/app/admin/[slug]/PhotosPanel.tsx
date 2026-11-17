"use client";

import { useState, useTransition } from "react";
import { createAlbum, deleteAlbum, deleteCategory, renameAlbum, setCover } from "../actions";
import ConfirmButton from "./ConfirmButton";
import Uploader from "./Uploader";
import MoreMenu, { menuItem, menuItemDanger } from "../MoreMenu";
import { Icon } from "../ui";
import PhotoGrid, { type AdminPhoto } from "./PhotoGrid";

export type AdminAlbum = { id: string; title: string };

const albumOf = (name: string) => (name.includes("/") ? name.slice(0, name.indexOf("/")) : "");

// Abas de álbuns: o envio e a grade seguem o álbum selecionado
export default function PhotosPanel({
  slug,
  albums,
  photos,
  favorites,
  cover: initialCover,
  coverChosen: initialChosen,
  coverOverridden = false,
  totalLabel = "",
}: {
  slug: string;
  albums: AdminAlbum[];
  photos: AdminPhoto[];
  favorites: string[];
  /** Foto que está na capa agora (escolhida ou automática) */
  cover?: string;
  coverChosen: boolean;
  /** Há uma capa enviada em "Capa da entrega", que vale mais que as fotos */
  coverOverridden?: boolean;
  /** "15 · 1 MB": todas as fotos da entrega, para o "Excluir todas as fotos" */
  totalLabel?: string;
}) {
  // A capa muda na hora na tela; o servidor salva em seguida
  const [cover, setCoverState] = useState({ name: initialCover, chosen: initialChosen });
  const [savingCover, startCover] = useTransition();
  const coverPhoto = photos.find((p) => p.name === cover.name);

  function chooseCover(name: string) {
    const previous = cover;
    setCoverState(name ? { name, chosen: true } : { name: photos[0]?.name, chosen: false });
    startCover(async () => {
      const result = await setCover(slug, name);
      if (result.error) {
        setCoverState(previous);
        alert(result.error);
      }
    });
  }

  const [selected, setSelected] = useState(albums[0]?.id ?? "");
  const [mode, setMode] = useState<"idle" | "new" | "rename">("idle");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Se o álbum selecionado foi excluído, volta para o primeiro
  const current = albums.find((a) => a.id === selected) ?? albums[0];
  const albumPhotos = photos.filter((p) => albumOf(p.name) === current.id);
  const count = (id: string) => photos.filter((p) => albumOf(p.name) === id).length;

  function submit() {
    setError("");
    startTransition(async () => {
      if (mode === "new") {
        const result = await createAlbum(slug, value);
        if (result.error) return setError(result.error);
        if (result.id !== undefined) setSelected(result.id);
      } else {
        const result = await renameAlbum(slug, current.id, value);
        if (result.error) return setError(result.error);
      }
      setMode("idle");
    });
  }

  function remove() {
    const n = albumPhotos.length;
    if (!confirm(`Excluir o álbum "${current.title}"${n ? ` e as ${n} fotos dele` : ""}? Não dá para desfazer.`)) return;
    startTransition(async () => {
      const result = await deleteAlbum(slug, current.id);
      if (result.error) alert(result.error);
      else setSelected(albums[0]?.id ?? "");
    });
  }

  const tab = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
      active ? "bg-adm-ink text-white" : "bg-adm-chip text-adm-hover hover:bg-adm-line"
    }`;

  return (
    <div>
      {coverPhoto && cover.chosen && !coverOverridden && (
        <p className="mb-3 flex flex-wrap items-center gap-x-2 text-sm text-adm-muted">
          <span>
            Capa das fotos: <strong className="font-medium text-adm-ink">{coverPhoto.name.slice(coverPhoto.name.lastIndexOf("/") + 1)}</strong>
            {savingCover && " · salvando..."}
          </span>
          <button type="button" onClick={() => chooseCover("")} className="font-medium text-adm-ink underline underline-offset-2">
            Voltar para automática
          </button>
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {albums.map((a) => (
          <button key={a.id} type="button" onClick={() => setSelected(a.id)} className={tab(a.id === current.id)}>
            {a.title} ({count(a.id)})
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setMode("new");
            setValue("");
            setError("");
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-adm-ink-2 hover:bg-adm-soft"
        >
          <Icon name="plus" className="h-4 w-4" />
          Novo álbum
        </button>
        <div className="ml-auto">
          <MoreMenu label="Opções das fotos">
            <button
              type="button"
              className={menuItem}
              onClick={() => {
                setMode("rename");
                setValue(current.title);
                setError("");
              }}
            >
              <Icon name="edit" className="h-4 w-4" />
              Renomear “{current.title}”
            </button>
            {current.id !== "" && (
              <button type="button" onClick={remove} disabled={pending} className={menuItemDanger}>
                <Icon name="trash" className="h-4 w-4" />
                Excluir álbum “{current.title}”
              </button>
            )}
            {photos.length > 0 && (
              <form action={deleteCategory}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="category" value="photos" />
                <ConfirmButton
                  message={`Excluir todas as fotos da entrega, de todos os álbuns (${totalLabel})? Não dá para desfazer.`}
                  className={menuItemDanger}
                >
                  <Icon name="trash" className="h-4 w-4" />
                  Excluir todas as fotos
                </ConfirmButton>
              </form>
            )}
          </MoreMenu>
        </div>
      </div>

      {mode !== "idle" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-adm-soft p-3"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            maxLength={60}
            placeholder={mode === "new" ? "Ex.: Bastidores" : current.title}
            className="h-10 min-w-0 flex-1 rounded-full border border-adm-line-strong bg-white px-3 text-[15px] outline-none focus:border-adm-ink focus:ring-2 focus:ring-adm-ink/20"
          />
          <button
            disabled={pending}
            className="h-10 rounded-full bg-adm-ink px-5 text-sm font-semibold text-white hover:bg-adm-hover disabled:opacity-60"
          >
            {pending ? "Salvando..." : mode === "new" ? "Criar álbum" : "Salvar nome"}
          </button>
          <button type="button" onClick={() => setMode("idle")} className="h-10 rounded-full px-4 text-sm text-adm-muted hover:bg-white">
            Cancelar
          </button>
          {error && <p className="w-full text-sm text-red-700">{error}</p>}
        </form>
      ) : null}

      <Uploader
        slug={slug}
        category="photos"
        album={current.id}
        label={albums.length > 1 ? `Enviar para “${current.title}”` : "Enviar fotos"}
        existing={albumPhotos.map((p) => p.name.slice(p.name.lastIndexOf("/") + 1))}
      />

      <div className="mt-4">
        {albumPhotos.length ? (
          <PhotoGrid
            key={`${current.id}:${albumPhotos.length}`}
            slug={slug}
            photos={albumPhotos}
            favorites={favorites}
            cover={cover.name}
            onSetCover={chooseCover}
          />
        ) : (
          <p className="rounded-2xl bg-adm-soft px-4 py-10 text-center text-sm text-adm-muted">
            Nenhuma foto neste álbum ainda.
          </p>
        )}
      </div>
    </div>
  );
}
