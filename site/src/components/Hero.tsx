import Image from "next/image";
import { whatsappHref } from "@/lib/site-config";
import { getSiteSettings } from "@/content/settings";

export default async function Hero() {
  const { heroImage, heroVideo } = await getSiteSettings();

  return (
    <section className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden bg-void">
      <div className="absolute inset-0" aria-hidden>
        {heroVideo ? (
          <video
            src={heroVideo}
            poster={heroImage}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[78%_28%] md:object-center"
          />
        ) : (
          <>
            {/* Fallback enquanto não há foto/vídeo cadastrado no Prismic
                (Configurações do site → Imagem/Vídeo do Hero). */}
            <div className="absolute inset-0 bg-gradient-to-b from-void via-ink to-ink" />
            <Image
              src="/brand/symbol-white.svg"
              alt=""
              width={900}
              height={660}
              className="absolute -right-24 top-1/2 -translate-y-1/2 w-[70vw] max-w-[900px] opacity-[0.05]"
              priority
            />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-void/70 via-ink/40 to-ink" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(232,143,79,0.08),_transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 md:px-10 pb-16 md:pb-24 pt-40">
        <p className="animate-fade-in text-xs md:text-sm tracking-[0.25em] text-mist uppercase mb-6 md:mb-8">
          Izaldo Bacelar — Filmmaker &amp; Fotógrafo · IB Films
        </p>

        <h1 className="animate-fade-up text-[13vw] leading-[0.95] md:text-[6.4vw] md:leading-[0.95] font-black tracking-tight max-w-5xl">
          Imagem pensada.
          <br />
          <span className="text-mist">Não apenas registrada.</span>
        </h1>

        <p
          className="animate-fade-up mt-8 md:mt-10 max-w-md md:max-w-lg text-base md:text-lg text-paper/80"
          style={{ animationDelay: "150ms" }}
        >
          Direção, fotografia e edição em uma só visão — filmes e imagens para
          marcas, empresas, eventos e casamentos que querem ser lembrados.
        </p>

        <div
          className="animate-fade-up mt-10 md:mt-12 flex flex-wrap items-center gap-4 md:gap-6"
          style={{ animationDelay: "300ms" }}
        >
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-ink hover:bg-accent transition-colors"
          >
            Vamos conversar
          </a>
          <a href="#trabalhos" className="inline-flex items-center gap-2 text-sm text-paper/70 hover:text-paper transition-colors">
            Ver trabalhos
            <span aria-hidden>↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
