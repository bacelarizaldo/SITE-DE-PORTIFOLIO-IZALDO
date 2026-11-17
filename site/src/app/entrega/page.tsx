import Image from "next/image";
import { whatsappHref } from "@/lib/site-config";
import EntregaFooter from "./EntregaFooter";

// As entregas abrem pelo link enviado a cada cliente; esta página só orienta quem chega sem ele
export default function EntregaPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center">
            <Image src="/brand/lockup-horizontal-white.svg" alt="IB Films" width={180} height={36} className="h-9 w-auto" />
          </div>
          <div className="rounded-[30px] border border-line bg-[#0c1d28] p-7 md:p-9">
            <p className="text-sm uppercase tracking-[0.2em] text-mist">Entregas</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">Seu material está num link exclusivo</h1>
            <p className="mt-3 text-base leading-7 text-paper/75">
              Os vídeos e as fotos de cada projeto ficam num link próprio, que enviamos por WhatsApp ou e-mail na
              entrega. É só abrir esse link no computador ou no celular.
            </p>
            <p className="mt-3 text-base leading-7 text-paper/75">Não encontrou a mensagem? Fale com a gente que reenviamos.</p>
            <a
              href={whatsappHref}
              className="mt-7 flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-base font-semibold text-ink transition hover:bg-[#f0a46c]"
            >
              Pedir o link no WhatsApp
            </a>
          </div>
        </div>
      </div>
      <EntregaFooter />
    </main>
  );
}
