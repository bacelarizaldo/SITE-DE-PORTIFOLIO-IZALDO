"use client";

import { useActionState, useState } from "react";
import { adminLogin, createGallery, updateGallery, type FormState } from "./actions";

export const inputClass =
  "h-12 w-full rounded-2xl border border-adm-line bg-adm-soft px-4 text-base text-adm-ink outline-none transition placeholder:text-adm-muted/70 focus:border-adm-ink focus:bg-white focus:ring-4 focus:ring-adm-ink/10";
export const buttonClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-adm-ink px-6 text-sm font-semibold text-white transition hover:bg-adm-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ink disabled:opacity-60";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-adm-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-5 text-adm-muted">{hint}</span>}
    </label>
  );
}

function Message({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-medium text-red-700">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="text-sm font-medium text-emerald-700">
        {state.ok}
      </p>
    );
  return null;
}

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(adminLogin, {});
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-adm-ink">Senha</span>
        <span className="relative block">
          <input
            id="admin-senha"
            name="senha"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            autoFocus
            aria-invalid={Boolean(state.error)}
            className="h-14 w-full rounded-full border border-adm-ink/80 bg-white pr-24 pl-6 text-base text-adm-ink outline-none transition focus:border-adm-ink focus:ring-4 focus:ring-adm-ink/10"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            className="absolute top-1/2 right-2 h-10 -translate-y-1/2 rounded-full px-4 text-sm font-medium text-adm-muted transition hover:bg-adm-soft hover:text-adm-ink"
          >
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        </span>
      </label>
      <Message state={state} />
      <button
        disabled={pending}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent text-base font-bold text-ink transition hover:bg-[#f0a46c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ink disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export function CreateGalleryForm({ onCancel }: { onCancel?: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createGallery, {});
  return (
    <form action={action} className="grid gap-4">
      <Field label="Cliente e projeto">
        <input id="nova-title" name="title" placeholder="Azov Yachts — Lançamento 2026" required autoFocus className={inputClass} />
      </Field>
      <Field label="Data da gravação">
        <input id="nova-date" name="date" type="date" className={inputClass} />
      </Field>
      <Field
        label="Nome no link (opcional)"
        hint="Vazio gera pelo nome. O link ganha um código no fim: …/entrega/azov-yachts-lancamento-2026-k7m2xq9p"
      >
        <input id="nova-slug" name="slug" autoCapitalize="none" placeholder="azov-yachts-lancamento-2026" className={inputClass} />
      </Field>
      <Message state={state} />
      <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-12 items-center rounded-full px-5 text-sm font-medium text-adm-ink-2 hover:bg-adm-soft"
          >
            Cancelar
          </button>
        )}
        <button disabled={pending} className={buttonClass}>
          {pending ? "Criando..." : "Criar entrega"}
        </button>
      </div>
    </form>
  );
}

export function EditGalleryForm({ slug, title, date }: { slug: string; title: string; date?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateGallery, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="slug" value={slug} />
      <Field label="Cliente e projeto">
        <input id="editar-title" name="title" defaultValue={title} required className={inputClass} />
      </Field>
      <Field label="Data da gravação">
        <input id="editar-date" name="date" type="date" defaultValue={date} className={inputClass} />
      </Field>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button disabled={pending} className={buttonClass}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
        <Message state={state} />
      </div>
    </form>
  );
}
