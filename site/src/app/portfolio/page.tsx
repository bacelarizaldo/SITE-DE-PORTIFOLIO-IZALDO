import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PortfolioGrid from "@/components/PortfolioGrid";
import { getAllProjects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Portfólio",
  description:
    "Trabalhos de Izaldo Bacelar (IB Films) em produção audiovisual: filmes para empresas, eventos, casamentos, redes sociais e fotografia, em Recife e no Brasil.",
  alternates: { canonical: "/portfolio" },
};

export const revalidate = 60;

export default async function PortfolioPage() {
  const projects = await getAllProjects();

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
        </div>
      </main>
      <Footer />
    </>
  );
}
