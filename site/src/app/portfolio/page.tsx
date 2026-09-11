import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PortfolioGrid from "@/components/PortfolioGrid";
import ReelsPortfolioGrid from "@/components/ReelsPortfolioGrid";
import { getAllProjects } from "@/content/projects";
import { getAllReels } from "@/content/reels";

export const metadata: Metadata = {
  title: "Portfólio",
  description:
    "Trabalhos de Izaldo Bacelar (IB Films) em produção audiovisual e reels para tráfego pago: empresas, eventos, casamentos e redes sociais, em Recife e no Brasil.",
  alternates: { canonical: "/portfolio" },
};

export const revalidate = 60;

export default async function PortfolioPage() {
  const [projects, reels] = await Promise.all([getAllProjects(), getAllReels()]);

  return (
    <>
      <Nav />
      <main className="pt-40 pb-24 md:pb-36">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Portfólio.</h1>
          <p className="text-base md:text-lg text-paper/60 max-w-xl mb-16 md:mb-24">
            Uma seleção curada de trabalhos — direção, fotografia e edição em
            cada projeto.
          </p>
          <PortfolioGrid projects={projects} />

          {reels.length > 0 && (
            <div className="mt-24 md:mt-36 pt-16 md:pt-24 border-t border-line">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                Reels & <span className="text-mist">conteúdo para redes.</span>
              </h2>
              <p className="text-base md:text-lg text-paper/60 max-w-xl mb-12 md:mb-16">
                Boa parte da produção atual é pensada pro feed e pro tráfego
                pago — vídeos verticais para redes sociais e campanhas.
              </p>
              <ReelsPortfolioGrid reels={reels} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
