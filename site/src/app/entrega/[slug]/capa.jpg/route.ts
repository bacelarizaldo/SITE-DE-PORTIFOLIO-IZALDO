import sharp from "sharp";
import { previewCoverKey } from "../previewCover";
import { readObject } from "@/lib/r2";

/**
 * Imagem da prévia do link (WhatsApp, Instagram, iMessage): a capa da entrega em 1200×630, leve,
 * num endereço fixo. O link assinado do R2 expira; este não.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: link } = await params;
  const key = await previewCoverKey(link);
  if (!key) return new Response("Sem capa", { status: 404 });
  const original = await readObject(key);
  if (!original) return new Response("Sem capa", { status: 404 });
  const image = await sharp(original)
    .rotate()
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
