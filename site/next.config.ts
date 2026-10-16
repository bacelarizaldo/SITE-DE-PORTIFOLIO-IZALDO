import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita o Next.js confundir a raiz do projeto quando existe outro
  // package-lock.json na pasta acima (SITE DE PORTIFOLIO IZALDO).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // LP de quadros é um HTML estático em public/quadros/ — servido em /quadros
  async rewrites() {
    return [{ source: "/quadros", destination: "/quadros/index.html" }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.prismic.io",
      },
    ],
    // AVIF primeiro (menor payload), com fallback pra WebP.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
