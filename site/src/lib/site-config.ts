// Configuração central da marca.

export const siteConfig = {
  name: "Izaldo Bacelar",
  brand: "IB Films",
  title: "Izaldo Bacelar | IB Films — Filmmaker & Fotógrafo em Recife",
  description:
    "Izaldo Bacelar é filmmaker e fotógrafo à frente da IB Films, produzindo filmes e conteúdo audiovisual para marcas, empresas, eventos e casamentos em Recife e todo o Brasil.",
  url: "https://izaldobacelar.com.br", // TODO: confirmar domínio final
  location: "Recife, Pernambuco — Brasil",
  instagram: "https://instagram.com/izaldobacelar",
  whatsappNumber: "5581999476729",
  whatsappMessage: "Olá! Vim pelo site e gostaria de falar sobre um projeto.",
  email: "contato@izaldobacela.com",
};

export const whatsappHref = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
  siteConfig.whatsappMessage
)}`;

export const navLinks = [
  { label: "Trabalhos", href: "/portfolio" },
  { label: "Serviços", href: "/servicos" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];
