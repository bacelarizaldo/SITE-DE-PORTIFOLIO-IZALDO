import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Painel e entregas dos clientes ficam fora dos buscadores
      disallow: ["/admin", "/entrega/", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
