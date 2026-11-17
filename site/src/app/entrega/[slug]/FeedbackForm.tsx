"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendFeedback } from "../actions";

const NAME_KEY = "ibfilms:recado-nome";
const MAX = 2000;

// Recado geral sobre a entrega: o cliente escreve o que achou ou pede um ajuste, sem precisar
// escolher uma foto. O recado chega na seção Feedback do admin.
export default function FeedbackForm({ link, title }: { link: string; title: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Depois de enviar, mostra o agradecimento até a pessoa pedir para escrever outro
  const [showThanks, setShowThanks] = useState(false);
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  // Lembra o nome neste aparelho para o próximo recado
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved && nameRef.current && !nameRef.current.value) nameRef.current.value = saved;
    } catch {}
  }, [showThanks]);

  function submit(data: FormData) {
    setError("");
    startTransition(async () => {
      const result = await sendFeedback(link, {}, data);
      if (!result.ok) {
        setError(result.error ?? "Não foi possível enviar agora. Tente de novo.");
        return;
      }
      setMessage("");
      setShowThanks(true);
      try {
        const name = String(data.get("nome") ?? "").trim();
        if (name) localStorage.setItem(NAME_KEY, name);
      } catch {}
    });
  }

  return (
    <section id="recado" aria-labelledby="recado-titulo" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-14 md:py-20">
      <div className="rounded-[28px] border border-line bg-[#0c1d28] p-6 shadow-sm md:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-mist">Recado</p>
        <h2 id="recado-titulo" className="mt-3 text-2xl font-semibold text-paper md:text-3xl">
          O que achou da entrega?
        </h2>
        <p className="mt-2 max-w-xl leading-7 text-paper/75">
          Conte o que achou dos vídeos e das fotos ou peça algum ajuste. O recado vai direto para a equipe da
          IB Films.
        </p>

        {showThanks ? (
          <div role="status" className="mt-8 rounded-2xl bg-white/10 px-5 py-6 text-center">
            <p className="text-lg font-semibold text-paper">Recado enviado. Obrigado!</p>
            <p className="mt-1 text-sm text-paper/75">Respondemos pelo WhatsApp ou por e-mail se precisar de algum ajuste.</p>
            <button
              type="button"
              onClick={() => setShowThanks(false)}
              className="mt-4 text-sm font-medium text-paper underline underline-offset-4"
            >
              Escrever outro recado
            </button>
          </div>
        ) : (
          <form action={submit} className="mt-8 grid gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-paper">Seu nome e empresa (opcional)</span>
              <input
                ref={nameRef}
                id="recado-nome"
                name="nome"
                maxLength={80}
                autoComplete="name"
                placeholder={title}
                className="h-12 w-full rounded-xl border border-line bg-void/40 px-4 text-base text-paper outline-none transition focus:border-accent focus:bg-void/60 focus:ring-2 focus:ring-accent/25"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-paper">Mensagem</span>
              <textarea
                id="recado-mensagem"
                name="mensagem"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={2}
                maxLength={MAX}
                rows={5}
                placeholder="Ex.: Ficou ótimo! Dá para ter uma versão de 30 segundos para o Instagram?"
                className="block w-full resize-y rounded-xl border border-line bg-void/40 px-4 py-3 text-base leading-7 text-paper outline-none transition focus:border-accent focus:bg-void/60 focus:ring-2 focus:ring-accent/25"
              />
              <span className="mt-1 block text-right text-xs tabular-nums text-mist">
                {message.length}/{MAX}
              </span>
            </label>
            {/* Armadilha para robôs: escondida de pessoas e de leitores de tela */}
            <input name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            {error && (
              <p role="alert" className="text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            <div>
              <button
                disabled={pending || message.trim().length < 2}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-8 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#f0a46c] disabled:opacity-50"
              >
                {pending ? "Enviando..." : "Enviar recado"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
