"use client";

import { useState, type FormEvent } from "react";
import { siteConfig } from "@/lib/site-config";

const projectTypes = ["Empresa", "Redes sociais", "Evento", "Casamento", "Fotografia", "Outro"];

const inputClass =
  "w-full bg-transparent border-b border-line focus:border-accent outline-none py-3 text-paper placeholder:text-mist/60 transition-colors";

export default function ContactForm() {
  const [projectType, setProjectType] = useState(projectTypes[0]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const nome = data.get("nome");
    const empresa = data.get("empresa");
    const email = data.get("email");
    const whatsapp = data.get("whatsapp");
    const mensagem = data.get("mensagem");

    const lines = [
      "Olá! Vim pelo site e gostaria de falar sobre um projeto.",
      "",
      `Nome: ${nome}`,
      empresa ? `Empresa: ${empresa}` : null,
      `Tipo de projeto: ${projectType}`,
      `E-mail: ${email}`,
      whatsapp ? `WhatsApp: ${whatsapp}` : null,
      "",
      `Mensagem: ${mensagem}`,
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${siteConfig.whatsappNumber}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <input name="nome" required placeholder="Nome" className={inputClass} />
        <input name="empresa" placeholder="Empresa (opcional)" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <input name="email" type="email" required placeholder="E-mail" className={inputClass} />
        <input name="whatsapp" placeholder="WhatsApp" className={inputClass} />
      </div>

      <div>
        <p className="text-sm text-mist mb-3">Tipo de projeto</p>
        <div className="flex flex-wrap gap-2">
          {projectTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setProjectType(type)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                projectType === type
                  ? "border-accent text-accent"
                  : "border-line text-mist hover:text-paper hover:border-paper/40"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <textarea
        name="mensagem"
        required
        rows={4}
        placeholder="Conte um pouco sobre o projeto"
        className={`${inputClass} resize-none`}
      />

      <button
        type="submit"
        className="inline-flex w-fit items-center rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-ink hover:bg-accent transition-colors"
      >
        Enviar pelo WhatsApp
      </button>
    </form>
  );
}
