"use client";

import { useState } from "react";

export default function CopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl bg-adm-soft p-4">
      <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-6 text-adm-ink-2 [scrollbar-width:thin]">{text}</pre>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="mt-3 inline-flex h-10 items-center rounded-full bg-adm-ink px-5 text-sm font-semibold text-white transition hover:bg-adm-hover"
      >
        {copied ? "Copiado!" : "Copiar mensagem"}
      </button>
    </div>
  );
}
