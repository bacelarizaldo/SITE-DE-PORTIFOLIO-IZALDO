"use client";

import { useEffect, useState } from "react";

// Entregas enviadas antes de as medidas serem salvas no upload: o admin mede as
// miniaturas aqui no navegador e salva, para o mosaico do cliente reservar o espaço certo.
export default function DimsBackfill({ slug, missing: initial }: { slug: string; missing: { name: string; url: string }[] }) {
  // Lista fixa da primeira renderização: excluir fotos depois não reinicia a medição
  const [missing] = useState(initial);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!missing.length) return;
    let cancelled = false;
    let index = 0;
    let pending: Record<string, [number, number]> = {};
    let chain = Promise.resolve();

    const flush = () => {
      const dims = pending;
      pending = {};
      if (!Object.keys(dims).length) return chain;
      chain = chain.then(() =>
        fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "dims", slug, dims }),
        }).then(
          () => {},
          () => {}
        )
      );
      return chain;
    };

    const measure = (url: string) =>
      new Promise<[number, number] | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
        img.onerror = () => resolve(null);
        img.src = url;
      });

    const worker = async () => {
      while (!cancelled && index < missing.length) {
        const { name, url } = missing[index++];
        const dims = await measure(url);
        if (dims) pending[name] = dims;
        if (Object.keys(pending).length >= 50) flush();
        setDone((d) => d + 1);
      }
    };

    Promise.all(Array.from({ length: 6 }, worker)).then(flush);
    return () => {
      cancelled = true;
      flush();
    };
  }, [slug, missing]);

  if (!missing.length) return null;
  const finished = done >= missing.length;
  return (
    <p className="mb-3 rounded-2xl bg-adm-soft px-4 py-2.5 text-sm text-adm-ink-2">
      {finished
        ? "Página de entrega otimizada."
        : `Otimizando a página de entrega: ${done} de ${missing.length} fotos. Mantenha esta página aberta.`}
    </p>
  );
}
