import type { Metadata, Viewport } from "next";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";
import "./globals.css";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "filmmaker Recife",
    "videomaker Recife",
    "produtora audiovisual Recife",
    "vídeo institucional Recife",
    "fotógrafo Recife",
    "filmagem de casamento Recife",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#08161f",
  colorScheme: "dark",
};

// Dados estruturados (schema.org) — ajuda buscadores a entenderem que
// "Izaldo Bacelar" / "IB Films" é a mesma entidade (pessoa + serviço),
// o que favorece resultados ricos ao buscar pelo nome.
function StructuredData() {
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${siteConfig.url}/#business`,
        name: `${siteConfig.brand} — ${siteConfig.name}`,
        image: `${siteConfig.url}/og-image.jpg`,
        url: siteConfig.url,
        email: siteConfig.email,
        telephone: `+${siteConfig.whatsappNumber}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Recife",
          addressRegion: "PE",
          addressCountry: "BR",
        },
        areaServed: "BR",
        sameAs: [siteConfig.instagram],
        founder: { "@id": `${siteConfig.url}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${siteConfig.url}/#person`,
        name: siteConfig.name,
        jobTitle: "Filmmaker & Fotógrafo",
        url: siteConfig.url,
        image: `${siteConfig.url}/og-image.jpg`,
        email: siteConfig.email,
        worksFor: { "@id": `${siteConfig.url}/#business` },
        sameAs: [siteConfig.instagram],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <StructuredData />
      </head>
      <body className="min-h-full flex flex-col bg-ink text-paper">{children}</body>
    </html>
  );
}
