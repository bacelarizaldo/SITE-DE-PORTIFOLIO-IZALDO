// Configuração central da marca.

export const siteConfig = {
  name: "Izaldo Bacelar",
  brand: "IB Films",
  title: "Izaldo Bacelar | IB Films — Filmmaker & Fotógrafo em Recife",
  description:
    "Izaldo Bacelar é filmmaker e fotógrafo à frente da IB Films — filmes e fotografia para marcas, empresas, eventos e casamentos em Recife e no Brasil.",
  url: "https://www.izaldobacelar.com",
  location: "Recife, Pernambuco — Brasil",
  instagram: "https://instagram.com/izaldobacelar",
  whatsappNumber: "5581999476729",
  whatsappMessage: "Olá! Vim pelo site e gostaria de falar sobre um projeto.",
  email: "contato@izaldobacela.com",
};

export const whatsappHref = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
  siteConfig.whatsappMessage
)}`;

// `plain: true` = página estática em /public (ex.: LP de quadros): usa <a> comum
// em vez de <Link>, para o navegador carregar o HTML direto.
export type NavLink = { label: string; href: string; plain?: boolean };

export const navLinks: NavLink[] = [
  { label: "Trabalhos", href: "/portfolio" },
  { label: "Serviços", href: "/servicos" },
  { label: "Quadros", href: "/quadros", plain: true },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];
