"use client";

import { useState, useTransition } from "react";
import { renewGalleryLink } from "../actions";

export default function AccessCard({ slug, link, hasCode }: { slug: string; link: string; hasCode: boolean }) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function renew() {
    const warning = hasCode
      ? "Trocar o link? O link atual deixa de funcionar e você precisa reenviar o novo ao cliente."
      : "Gerar o link com código? O link atual (só com o nome) deixa de funcionar e você precisa reenviar o novo ao cliente.";
    if (!confirm(warning)) return;
    startTransition(async () => {
      const result = await renewGalleryLink(slug);
      if (result.error) alert(result.error);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {!hasCode && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
          <p>
            <strong>Este link pode ser adivinhado</strong>: ele é só o nome do projeto. Gere um link com código e
            reenvie ao cliente para proteger o material.
          </p>
          <button
            type="button"
            onClick={renew}
            disabled={pending}
            className="mt-2 inline-flex h-9 items-center rounded-full bg-amber-900 px-4 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
          >
            {pending ? "Gerando..." : "Gerar link com código"}
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-adm-soft px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.15em] text-adm-muted">Link da entrega (sem senha)</p>
          <p className="mt-0.5 truncate font-mono text-[15px] text-adm-ink">{link}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-adm-ink px-4 text-sm font-semibold text-white transition hover:bg-adm-hover"
        >
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      {hasCode && (
        <p className="text-xs text-adm-muted">
          O código no fim do link impede que alguém chegue à entrega só sabendo o nome do projeto.{" "}
          <button type="button" onClick={renew} disabled={pending} className="font-medium text-adm-ink underline underline-offset-2">
            {pending ? "Trocando..." : "Trocar link"}
          </button>{" "}
          se ele tiver sido compartilhado com quem não devia.
        </p>
      )}
    </div>
  );
}
