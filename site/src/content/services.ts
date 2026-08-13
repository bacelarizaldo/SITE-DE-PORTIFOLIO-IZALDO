export type Service = {
  n: string;
  slug: string;
  title: string;
  summary: string;
  deliverables: string[];
};

export const services: Service[] = [
  {
    n: "01",
    slug: "empresas",
    title: "Filmes para empresas",
    summary:
      "Produção de vídeo para empresas e marcas — da direção à finalização, pensando a mensagem antes de ligar a câmera.",
    deliverables: [
      "Vídeos institucionais",
      "Vídeos comerciais",
      "Vídeos para campanhas",
      "Vídeos de posicionamento",
      "Vídeos de produto",
      "Vídeos para lançamentos",
      "Cobertura de eventos corporativos",
    ],
  },
  {
    n: "02",
    slug: "redes-sociais",
    title: "Conteúdo para redes sociais",
    summary:
      "Conteúdo vertical para Reels, TikTok, YouTube Shorts e LinkedIn — com planejamento, captação, direção e edição.",
    deliverables: [
      "Planejamento de conteúdo",
      "Captação",
      "Direção",
      "Edição",
      "Entrega de múltiplos vídeos",
      "Pacotes de produção recorrente",
    ],
  },
  {
    n: "03",
    slug: "eventos",
    title: "Eventos",
    summary:
      "Cobertura audiovisual de eventos corporativos, congressos, feiras, lançamentos e experiências de marca.",
    deliverables: [
      "Aftermovie",
      "Vídeos verticais e reels",
      "Registro fotográfico",
      "Teaser",
      "Vídeo institucional do evento",
    ],
  },
  {
    n: "04",
    slug: "casamentos",
    title: "Casamentos",
    summary:
      "Filme de casamento com abordagem cinematográfica e emocional — do making of à recepção.",
    deliverables: [
      "Making of",
      "Cerimônia e recepção",
      "Drone",
      "Trailer",
      "Filme completo",
      "Reels do dia",
    ],
  },
  {
    n: "05",
    slug: "fotografia",
    title: "Fotografia",
    summary:
      "Fotografia profissional para empresas, eventos, profissionais, produtos, marcas e campanhas.",
    deliverables: [
      "Fotografia corporativa",
      "Fotografia de eventos",
      "Fotografia de produto",
      "Conteúdo para redes sociais",
    ],
  },
];
