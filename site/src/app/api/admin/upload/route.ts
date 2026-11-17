import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  CATEGORIES,
  GALLERY_COVER,
  abortMultipart,
  addPhotoDims,
  attachment,
  assertKeyInGallery,
  completeMultipart,
  createMultipart,
  fileKey,
  galleryAlbums,
  getMeta,
  isPhotoName,
  sanitizeFileName,
  signPart,
  signPut,
  videoCoverName,
  type Category,
  type PhotoDims,
} from "@/lib/r2";
import { MAX_SIZE, formatLimit } from "@/lib/uploadRules";

// O navegador envia os arquivos direto para o R2 com URLs assinadas;
// esta rota só autoriza e assina, então os vídeos grandes não passam pela Vercel.
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const slug = String(body.slug ?? "");
  const meta = await getMeta(slug);
  if (!meta) {
    return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 });
  }

  // Fotos de outros álbuns ficam em photos/<álbum>/; o álbum precisa existir na galeria
  const photoName = (file: string) => {
    const album = String(body.album ?? "");
    if (album && !galleryAlbums(meta).some((a) => a.id === album)) throw new Error("Álbum inválido");
    return album ? `${album}/${file}` : file;
  };

  // O navegador já confere o tamanho; aqui é a segunda barreira
  const checkSize = (category: Category) => {
    const size = Number(body.size ?? 0);
    if (size > MAX_SIZE[category]) throw new Error(`Arquivo maior que o limite de ${formatLimit(MAX_SIZE[category])}`);
  };

  try {
    switch (body.op) {
      case "photo": {
        // Original + miniatura + versão web assinados num único pedido
        checkSize("photos");
        const contentType = String(body.contentType || "image/jpeg");
        const file = sanitizeFileName(String(body.fileName ?? ""));
        const name = photoName(file);
        const disposition = attachment(file);
        const derived = `${name}.jpg`;
        const derivedHeaders = { "Content-Type": "image/jpeg" };
        const [original, thumb, web] = await Promise.all([
          signPut(fileKey(slug, "photos", name), contentType, disposition),
          signPut(fileKey(slug, "thumbs", derived), "image/jpeg"),
          signPut(fileKey(slug, "web", derived), "image/jpeg"),
        ]);
        return NextResponse.json({
          name,
          original: { url: original, headers: { "Content-Type": contentType, "Content-Disposition": disposition } },
          thumb: { url: thumb, headers: derivedHeaders },
          web: { url: web, headers: derivedHeaders },
        });
      }
      case "cover": {
        // Capa geral ou de um vídeo, já reduzida e convertida em JPEG no navegador
        const video = body.video ? String(body.video) : "";
        if (video && video !== sanitizeFileName(video)) throw new Error("Vídeo inválido");
        const key = fileKey(slug, "covers", video ? videoCoverName(video) : GALLERY_COVER);
        return NextResponse.json({ url: await signPut(key, "image/jpeg"), headers: { "Content-Type": "image/jpeg" } });
      }
      case "put":
      case "create": {
        const contentType = String(body.contentType || "application/octet-stream");
        const category = body.category as Category;
        if (!CATEGORIES.includes(category)) throw new Error("Categoria inválida");
        checkSize(category);
        const file = sanitizeFileName(String(body.fileName ?? ""));
        const name = category === "photos" ? photoName(file) : file;
        const key = fileKey(slug, category, name);
        const disposition = attachment(file);
        if (body.op === "put") {
          // O navegador precisa enviar os mesmos headers que foram assinados
          const headers = { "Content-Type": contentType, "Content-Disposition": disposition };
          return NextResponse.json({ key, name, headers, url: await signPut(key, contentType, disposition) });
        }
        return NextResponse.json({
          key,
          name,
          uploadId: await createMultipart(key, contentType, disposition),
        });
      }
      case "part": {
        assertKeyInGallery(slug, body.key);
        const partNumbers = (body.partNumbers as number[]).slice(0, 1000);
        const urls = await Promise.all(partNumbers.map((n) => signPart(body.key, body.uploadId, n)));
        return NextResponse.json({ urls });
      }
      case "dims": {
        // Largura e altura das fotos, usadas para reservar o espaço no mosaico da entrega
        const dims: PhotoDims = {};
        for (const [name, value] of Object.entries(body.dims ?? {})) {
          const [w, h] = value as number[];
          if (isPhotoName(name) && w > 0 && h > 0 && w < 100_000 && h < 100_000) {
            dims[name] = [Math.round(w), Math.round(h)];
          }
        }
        if (Object.keys(dims).length) await addPhotoDims(slug, dims);
        return NextResponse.json({ ok: true, saved: Object.keys(dims).length });
      }
      case "complete": {
        assertKeyInGallery(slug, body.key);
        await completeMultipart(body.key, body.uploadId, body.parts);
        return NextResponse.json({ ok: true });
      }
      case "abort": {
        assertKeyInGallery(slug, body.key);
        await abortMultipart(body.key, body.uploadId);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Operação inválida" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
